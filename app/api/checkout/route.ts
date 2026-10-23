import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";
import { sessionUser } from "../../../lib/auth";
import { db, cancelOrder, databaseConfigured } from "../../../lib/db";
import {
  validateItems,
  validateCustomer,
  calculateTotal,
} from "../../../lib/commerce";
type Line = { id: number; name: string; price_minor: number; quantity: number };
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(
    {
      live: process.env.STORE_LIVE === "true" && !!databaseConfigured(),
      cod: process.env.ENABLE_COD === "true",
      stripe: !!process.env.STRIPE_SECRET_KEY,
      currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR",
      country: process.env.STORE_COUNTRY || "PK",
      shippingMinor: Number(process.env.SHIPPING_MINOR || 0),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  if (process.env.STORE_LIVE !== "true" || !databaseConfigured())
    return NextResponse.json(
      {
        error:
          "The store is not accepting orders yet. Your cart is saved; no order or payment has been created.",
      },
      { status: 503 },
    );
  const origin = process.env.STORE_URL;
  if (!origin || request.headers.get("origin") !== new URL(origin).origin)
    return NextResponse.json(
      { error: "Invalid checkout origin." },
      { status: 403 },
    );
  const text = await request.text();
  if (text.length > 16000)
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  let items, customer;
  try {
    items = validateItems(body.items);
    customer = validateCustomer(body.customer);
    if (customer.country !== (process.env.STORE_COUNTRY || "PK"))
      throw new Error("This delivery country is not supported.");
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.requestKey,
      )
    )
      throw new Error("Invalid checkout request key.");
    if (!["cod", "stripe"].includes(body.method))
      throw new Error("Choose a payment method.");
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  if (
    (body.method === "cod" && process.env.ENABLE_COD !== "true") ||
    (body.method === "stripe" && !process.env.STRIPE_SECRET_KEY)
  )
    return NextResponse.json(
      { error: "This payment method is unavailable." },
      { status: 400 },
    );
  const account = await sessionUser();
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        items,
        customer,
        method: body.method,
        customerId: account?.id || null,
      }),
    )
    .digest("hex");
  const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR";
  const shipping = Number(process.env.SHIPPING_MINOR);
  let id = "";
  try {
    const result = await db().begin(async (sql) => {
      // A transaction-level lock serializes retries of the same request without a duplicate stock debit.
      await sql.lock("checkout:" + body.requestKey);
      const previous =
        await sql`SELECT id,status,payment_method,stripe_session_id,request_fingerprint,currency,shipping_minor FROM orders WHERE request_key=${body.requestKey}`;
      if (previous.length) {
        if (previous[0].request_fingerprint !== fingerprint)
          throw new Error("Your cart has changed. Start a new checkout.");
        const rows =
          await sql`SELECT product_id AS id,name,price_minor,quantity FROM order_items WHERE order_id=${previous[0].id} ORDER BY product_id`;
        return {
          order: previous[0],
          lines: rows as unknown as Line[],
          existing: true,
        };
      }
      const lines: Line[] = [];
      for (const item of [...items].sort((a, b) => a.id - b.id)) {
        const rows =
          await sql`SELECT * FROM products WHERE id=${item.id} AND active=true FOR UPDATE`;
        const p = rows[0];
        if (!p || p.stock < item.quantity)
          throw new Error(
            "A product is unavailable or its stock has changed. Please update your cart.",
          );
        if (p.currency !== currency)
          throw new Error("Product currency mismatch.");
        lines.push({
          id: p.id,
          name: p.name,
          price_minor: p.price_minor,
          quantity: item.quantity,
        });
      }
      const amount = calculateTotal(
        lines as { price_minor: number; quantity: number }[],
        shipping,
      );
      id = randomUUID();
      await sql`INSERT INTO orders (id,request_key,request_fingerprint,status,payment_method,currency,total_minor,shipping_minor,customer,customer_id) VALUES (${id},${body.requestKey},${fingerprint},${body.method === "cod" ? "confirmed" : "awaiting_payment"},${body.method},${currency},${amount},${shipping},${sql.json(customer)},${account?.id || null})`;
      for (const line of lines) {
        await sql`INSERT INTO order_items (order_id,product_id,name,price_minor,quantity) VALUES (${id},${line.id},${line.name},${line.price_minor},${line.quantity})`;
        await sql`UPDATE products SET stock=stock-${line.quantity} WHERE id=${line.id}`;
        const balance=await sql`SELECT stock FROM products WHERE id=${line.id}`;
        await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,reference,actor) VALUES(${line.id},${-line.quantity},${balance[0].stock},'Order placed',${id},'checkout')`;
      }
      return {
        order: {
          id,
          status: body.method === "cod" ? "confirmed" : "awaiting_payment",
          payment_method: body.method,
          stripe_session_id: null,
          currency,
          shipping_minor: shipping,
        },
        lines,
        existing: false,
      };
    });
    id = result.order.id;
    if (result.order.payment_method === "cod")
      return NextResponse.json({ orderId: id, status: result.order.status });
    if (result.order.status !== "awaiting_payment")
      return NextResponse.json(
        {
          error:
            "This checkout has already been completed or cancelled. Start a new checkout.",
        },
        { status: 409 },
      );
    if (result.existing && result.order.stripe_session_id) {
      const response = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${result.order.stripe_session_id}`,
        {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        },
      );
      const session = await response.json();
      if (!response.ok || !session.url)
        throw new Error("Payment session is unavailable.");
      return NextResponse.json({ url: session.url, orderId: id });
    }
    const form = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/order?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=1`,
      client_reference_id: id,
      "metadata[order_id]": id,
    });
    if (customer.email) form.set("customer_email", customer.email);
    result.lines.forEach((line, i) => {
      form.set(
        `line_items[${i}][price_data][currency]`,
        result.order.currency.toLowerCase(),
      );
      form.set(`line_items[${i}][price_data][product_data][name]`, line.name);
      form.set(
        `line_items[${i}][price_data][unit_amount]`,
        String(line.price_minor),
      );
      form.set(`line_items[${i}][quantity]`, String(line.quantity));
    });
    if (result.order.shipping_minor > 0) {
      const i = result.lines.length;
      form.set(
        `line_items[${i}][price_data][currency]`,
        result.order.currency.toLowerCase(),
      );
      form.set(`line_items[${i}][price_data][product_data][name]`, "Shipping");
      form.set(`line_items[${i}][price_data][unit_amount]`, String(shipping));
      form.set(`line_items[${i}][quantity]`, "1");
    }
    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": id,
        },
        body: form,
      },
    );
    const session = await response.json();
    if (!response.ok || !session.url) {
      await cancelOrder(id);
      return NextResponse.json(
        {
          error:
            "Card checkout could not be started. No payment was collected. Please try again.",
        },
        { status: 502 },
      );
    }
    await db()`UPDATE orders SET stripe_session_id=${session.id} WHERE id=${id}`;
    return NextResponse.json({ url: session.url, orderId: id });
  } catch (e) {
    console.error("Checkout failure", e instanceof Error ? e.name : "Unknown");
    return NextResponse.json(
      {
        error:
          e instanceof Error && /unavailable|currency|bag/.test(e.message)
            ? e.message
            : "Checkout is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}

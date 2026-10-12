import { db } from "../../../../lib/db";
import { sessionUser, checkOrigin, rateLimit } from "../../../../lib/auth";
export async function GET(request: Request) {
  try {
    const u = await sessionUser();
    if (!u)
      return Response.json(
        { error: "Sign in to view orders." },
        { status: 401 },
      );
    const offset = Math.max(
      0,
      Math.min(
        100000,
        Number(new URL(request.url).searchParams.get("offset")) || 0,
      ),
    );
    const orders =
      await db()`SELECT id,status,payment_method,currency,total_minor,shipping_minor,customer,created_at,updated_at,tracking_number,tracking_url FROM orders WHERE customer_id=${u.id} ORDER BY created_at DESC LIMIT 20 OFFSET ${Math.floor(offset)}`;
    const result = [];
    for (const o of orders) {
      const items =
        await db()`SELECT product_id,name,price_minor,quantity FROM order_items WHERE order_id=${o.id}`;
      const events =
        await db()`SELECT status,created_at FROM order_events WHERE order_id=${o.id} ORDER BY created_at`;
      result.push({ ...o, items, events });
    }
    const counts =
      await db()`SELECT count(*)::int AS count FROM orders WHERE customer_id=${u.id}`;
    return Response.json(
      { orders: result, total: counts[0].count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Order history is unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const u = await sessionUser();
    if (!u)
      return Response.json(
        { error: "Sign in to link an order." },
        { status: 401 },
      );
    await rateLimit("order-claim:" + u.id);
    const { id, key } = await request.json();
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (
      typeof id !== "string" ||
      typeof key !== "string" ||
      !uuid.test(id) ||
      !uuid.test(key)
    )
      throw Error("Invalid order confirmation.");
    const rows =
      await db()`UPDATE orders SET customer_id=${u.id} WHERE id=${id} AND request_key=${key} AND customer_id IS NULL RETURNING id`;
    return rows.length
      ? Response.json({ ok: true })
      : Response.json(
          {
            error:
              "This guest order could not be linked. It may already belong to an account.",
          },
          { status: 400 },
        );
  } catch {
    return Response.json(
      { error: "This guest order could not be linked." },
      { status: 400 },
    );
  }
}

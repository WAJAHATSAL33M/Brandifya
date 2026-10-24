import { timingSafeEqual } from "node:crypto";
import { db } from "../../../lib/db";
import { sessionUser, checkOrigin } from "../../../lib/auth";
import { rateLimit } from "../../../lib/rate-limit";
import { safeMediaUrl } from "../../../lib/auth-core";
import {
  normalizeTrackingContact,
  orderReferencePattern,
} from "../../../lib/order-tracking";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, private" };
const notFound = () =>
  Response.json(
    {
      error:
        "We couldn’t match those details. Check your full order reference and the phone number or email used at checkout.",
    },
    { status: 404, headers },
  );
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
  } catch {
    return Response.json(
      { error: "Please open tracking from the store website and try again." },
      { status: 403, headers },
    );
  }
  try {
    const text = await request.text();
    if (text.length > 3000)
      return Response.json(
        { error: "Request too large." },
        { status: 413, headers },
      );
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Enter a valid order reference." },
        { status: 400, headers },
      );
    }
    if (
      !body ||
      typeof body.id !== "string" ||
      !orderReferencePattern.test(body.id.trim())
    )
      return Response.json(
        {
          error: "Enter the full order reference from your confirmation page.",
        },
        { status: 400, headers },
      );
    const id = body.id.trim().toLowerCase(),
      contact = normalizeTrackingContact(body.contact);
    await rateLimit("tracking-global", 1000);
    await rateLimit("tracking-order:" + id, 30);
    const rows =
      await db()`SELECT id,status,customer_id,request_key,customer,created_at,updated_at,currency,total_minor,tracking_number,tracking_url FROM orders WHERE id=${id}`;
    if (!rows.length) return notFound();
    const order = rows[0],
      user = await sessionUser();
    const owner = user && order.customer_id === user.id;
    const key =
      typeof body.key === "string" && orderReferencePattern.test(body.key)
        ? body.key
        : "";
    const privateConfirmation =
      key && equal(key.toLowerCase(), String(order.request_key).toLowerCase());
    const country =
      order.customer?.country || process.env.STORE_COUNTRY || "PK";
    const submitted = normalizeTrackingContact(body.contact, country);
    const contactMatch =
      contact &&
      submitted &&
      [order.customer?.phone, order.customer?.email].some((value) => {
        const expected = normalizeTrackingContact(value, country);
        return expected && equal(submitted, expected);
      });
    if (!owner && !privateConfirmation && !contactMatch) return notFound();
    const [items, events] = await Promise.all([
      db()`SELECT name,quantity FROM order_items WHERE order_id=${id} ORDER BY product_id`,
      db()`SELECT status,created_at FROM order_events WHERE order_id=${id} ORDER BY created_at,id`,
    ]);
    return Response.json(
      {
        order: {
          id: order.id,
          status: order.status,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          currency: order.currency,
          totalMinor: order.total_minor,
          trackingNumber: order.tracking_number,
          trackingUrl: safeMediaUrl(order.tracking_url)
            ? order.tracking_url
            : "",
          items,
          events: events.map((event) => ({
            status: event.status,
            createdAt: event.created_at,
          })),
        },
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Too many attempts"))
      return Response.json({ error: error.message }, { status: 429, headers });
    return Response.json(
      {
        error:
          "Order tracking is temporarily unavailable. Please try again or contact our team with your order reference.",
      },
      { status: 503, headers },
    );
  }
}

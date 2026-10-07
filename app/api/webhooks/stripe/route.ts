import { createHmac, timingSafeEqual } from "node:crypto";
import { db, cancelOrder } from "../../../../lib/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Not configured", { status: 503 });
  const body = await request.text(),
    signature = request.headers.get("stripe-signature") || "";
  const parts = signature.split(",").map((p) => p.split("=")),
    timestamp = parts.find((p) => p[0] === "t")?.[1];
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300)
    return new Response("Invalid signature", { status: 400 });
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest();
  const valid = parts
    .filter((p) => p[0] === "v1")
    .some((p) => {
      const got = Buffer.from(p[1] || "", "hex");
      return got.length === expected.length && timingSafeEqual(got, expected);
    });
  if (!valid) return new Response("Invalid signature", { status: 400 });
  try {
    const event = JSON.parse(body),
      session = event.data.object,
      id = session.metadata?.order_id;
    if (!id) return new Response("Ignored");
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type) &&
      session.payment_status === "paid"
    ) {
      await db()`UPDATE orders SET status='paid',stripe_session_id=${session.id},updated_at=now() WHERE id=${id} AND payment_method='stripe' AND status='awaiting_payment' AND total_minor=${session.amount_total} AND lower(currency)=${session.currency}`;
    } else if (
      [
        "checkout.session.expired",
        "checkout.session.async_payment_failed",
      ].includes(event.type)
    ) {
      await cancelOrder(id);
    }
    return new Response("OK");
  } catch {
    return new Response("Webhook processing failed", { status: 500 });
  }
}

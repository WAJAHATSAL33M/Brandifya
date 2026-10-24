import { randomUUID } from "node:crypto";
import { db, databaseConfigured, type StoreSql } from "./db.ts";
import { storeOrigin } from "./store-origin.ts";
const emailReady = () =>
  Boolean(
    process.env.RESEND_API_KEY &&
      process.env.AUTH_FROM_EMAIL &&
      databaseConfigured() &&
      process.env.STORE_URL,
  );
import { normalizeEmail, safeMediaUrl } from "./auth-core.ts";
import { orderStatusLabels } from "./order-tracking.ts";
import { storeContact } from "./store-contact.ts";
export async function queueOrderNotification(
  sql: StoreSql,
  id: string,
  status: string,
) {
  const orders =
    await sql`SELECT customer,currency,total_minor,tracking_number,tracking_url,payment_method FROM orders WHERE id=${id}`;
  const order = orders[0];
  if (!order) return;
  let recipient;
  try {
    recipient = normalizeEmail(order.customer?.email);
  } catch {
    return;
  }
  const items =
    await sql`SELECT name,quantity FROM order_items WHERE order_id=${id} ORDER BY product_id`;
  const title = orderStatusLabels[status] || status;
  const total = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: order.currency,
  }).format(order.total_minor / 100);
  const text = [
    `Hello ${order.customer.name || "Customer"},`,
    `Your Brand E order is updated: ${title}.`,
    `Order reference: ${id}`,
    ...items.map((item) => `${item.name} × ${item.quantity}`),
    `Order total: ${total}`,
    order.payment_method === "cod"
      ? "Payment method: Cash on delivery."
      : "Payment method: Card.",
    order.tracking_number ? `Tracking number: ${order.tracking_number}` : "",
    safeMediaUrl(order.tracking_url)
      ? `Courier tracking: ${order.tracking_url}`
      : "",
    "This message records an order update. Use tracking for the latest status.",
    `Order tracking: ${storeOrigin()}/order-tracking?order=${encodeURIComponent(id)}`,
    `Questions? ${storeContact.email} · ${storeContact.phone}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  await sql`INSERT INTO order_notifications(id,order_id,status,recipient,subject,body) VALUES(${randomUUID()},${id},${status},${recipient},${"Brand E · " + title + " · #" + id.slice(0, 8).toUpperCase()},${text}) ON DUPLICATE KEY UPDATE id=id`;
}
export async function sendOrderNotifications(limit = 5) {
  if (!emailReady()) return { sent: 0, failed: 0, configured: false };
  let sent = 0,
    failed = 0;
  for (let i = 0; i < Math.min(Math.max(limit, 1), 5); i++) {
    const outcome = await db().begin(async (sql) => {
      const rows =
        await sql`SELECT id,recipient,subject,body,attempts FROM order_notifications WHERE sent_at IS NULL AND available_at<=now(3) AND attempts<8 ORDER BY created_at,id LIMIT 1 FOR UPDATE SKIP LOCKED`;
      if (!rows.length) return "empty";
      const job = rows[0];
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + process.env.RESEND_API_KEY,
            "Content-Type": "application/json",
            "Idempotency-Key": "order-notification/" + job.id,
          },
          body: JSON.stringify({
            from: process.env.AUTH_FROM_EMAIL,
            to: [job.recipient],
            subject: job.subject,
            text: job.body,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw Error("Email provider rejected the request.");
        await sql`UPDATE order_notifications SET sent_at=now(3),attempts=attempts+1,last_error='' WHERE id=${job.id}`;
        return "sent";
      } catch {
        const delay = Math.min(60, 2 ** Math.min(job.attempts + 1, 6));
        await sql`UPDATE order_notifications SET attempts=attempts+1,last_error='Delivery failed. Check sender settings and retry.',available_at=DATE_ADD(now(3),INTERVAL ${delay} MINUTE) WHERE id=${job.id}`;
        return "failed";
      }
    });
    if (outcome === "empty") break;
    if (outcome === "sent") sent++;
    else failed++;
  }
  return { sent, failed, configured: true };
}
export async function safelySendOrderNotifications() {
  try {
    await sendOrderNotifications();
  } catch {
    /* Persistent jobs remain available for retry. Never fail an accepted order. */
  }
}

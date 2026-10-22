import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/auth";
import { safeMediaUrl } from "../../../../lib/auth-core";
export async function GET(request: Request) {
  if (!adminAuthorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url),
      offset = Math.max(
        0,
        Math.floor(Number(url.searchParams.get("offset")) || 0),
      );
    const orders =
      await db()`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100 OFFSET ${offset}`;
    const result = [];
    for (const o of orders) {
      const items =
        await db()`SELECT product_id,name,price_minor,quantity FROM order_items WHERE order_id=${o.id}`;
      result.push({ ...o, items });
    }
    const summary =
      await db()`SELECT count(*) AS total,coalesce(sum(DATE(created_at)=current_date),0) AS today,coalesce(sum(status IN ('confirmed','paid','processing')),0) AS pending FROM orders`;
    return Response.json(
      { orders: result, summary: summary[0] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Orders unavailable. Check database setup." },
      { status: 503 },
    );
  }
}
export async function PATCH(request: Request) {
  if (!adminAuthorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (typeof b.id !== "string" || !/^[0-9a-f-]{36}$/i.test(b.id))
      throw Error("Invalid order.");
    if (
      b.trackingNumber !== undefined &&
      (typeof b.trackingNumber !== "string" || b.trackingNumber.length > 100)
    )
      throw Error("Invalid tracking number.");
    if (
      b.trackingUrl !== undefined &&
      (typeof b.trackingUrl !== "string" ||
        (b.trackingUrl && !safeMediaUrl(b.trackingUrl)))
    )
      throw Error("Invalid tracking URL.");
    await db().begin(async (sql) => {
      const rows =
        await sql`SELECT status FROM orders WHERE id=${b.id} FOR UPDATE`;
      if (!rows.length) throw Error("Order not found.");
      const previous: Record<string, string[]> = {
        processing: ["confirmed", "paid"],
        shipped: ["processing"],
        delivered: ["shipped"],
      };
      if (b.status) {
        if (!previous[b.status]?.includes(rows[0].status))
          throw Error("Invalid status transition.");
        await sql`UPDATE orders SET status=${b.status},updated_at=now() WHERE id=${b.id}`;
        await sql`INSERT INTO order_events (order_id,status) VALUES (${b.id},${b.status})`;
      }
      if (b.trackingNumber !== undefined)
        await sql`UPDATE orders SET tracking_number=${b.trackingNumber},tracking_url=${b.trackingUrl || ""},updated_at=now() WHERE id=${b.id}`;
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/mysql|database|postgres|column|relation/i.test(e.message)
            ? e.message
            : "Order update failed.",
      },
      { status: 400 },
    );
  }
}

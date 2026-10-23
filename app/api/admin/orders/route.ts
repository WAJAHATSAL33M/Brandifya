import { db } from "../../../../lib/db";
import { adminAuthorized, adminUser } from "../../../../lib/admin-auth";
import { safeMediaUrl } from "../../../../lib/auth-core";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const u = new URL(request.url),
      q = (u.searchParams.get("q") || "").slice(0, 200),
      status = u.searchParams.get("status") || "",
      from = u.searchParams.get("from") || "1000-01-01",
      to = u.searchParams.get("to") || "9999-12-31";
    const offset = Math.min(
        1000000,
        Math.max(0, Math.floor(Number(u.searchParams.get("offset")) || 0)),
      ),
      id = u.searchParams.get("id");
    if (id) {
      const rows = await db()`SELECT * FROM orders WHERE id=${id}`;
      if (!rows.length)
        return Response.json({ error: "Order not found." }, { status: 404 });
      const items = await db()`SELECT * FROM order_items WHERE order_id=${id}`,
        events =
          await db()`SELECT * FROM order_events WHERE order_id=${id} ORDER BY id`,
        notes =
          await db()`SELECT * FROM order_notes WHERE order_id=${id} ORDER BY id DESC`;
      return Response.json(
        { order: { ...rows[0], items }, events, notes },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to))
      throw Error("Invalid date.");
    const pattern = "%" + q + "%";
    const orders =
      await db()`SELECT * FROM orders WHERE (${status}='' OR status=${status}) AND DATE(created_at)>=${from} AND DATE(created_at)<=${to} AND (id LIKE ${pattern} OR CAST(customer AS CHAR) LIKE ${pattern} OR tracking_number LIKE ${pattern}) ORDER BY created_at DESC LIMIT 100 OFFSET ${offset}`;
    const result = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        items:
          await db()`SELECT product_id,name,price_minor,quantity FROM order_items WHERE order_id=${o.id}`,
      })),
    );
    const counts =
      await db()`SELECT count(*) AS total FROM orders WHERE (${status}='' OR status=${status}) AND DATE(created_at)>=${from} AND DATE(created_at)<=${to} AND (id LIKE ${pattern} OR CAST(customer AS CHAR) LIKE ${pattern} OR tracking_number LIKE ${pattern})`;
    const summary =
      await db()`SELECT count(*) AS total,coalesce(sum(DATE(created_at)=current_date),0) AS today,coalesce(sum(status IN ('confirmed','paid','processing')),0) AS pending FROM orders`;
    const revenue =
      await db()`SELECT currency,coalesce(sum(CASE WHEN status='delivered' THEN total_minor ELSE 0 END),0) AS delivered_minor,coalesce(sum(CASE WHEN status!='cancelled' THEN total_minor ELSE 0 END),0) AS ordered_minor FROM orders GROUP BY currency`;
    const daily =
      await db()`SELECT DATE(created_at) AS day,count(*) AS count FROM orders WHERE created_at>=DATE_SUB(current_date,INTERVAL 13 DAY) GROUP BY DATE(created_at) ORDER BY day`;
    return Response.json(
      {
        orders: result,
        summary: summary[0],
        total: counts[0].total,
        revenue,
        daily,
      },
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
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json(),
      actor = (await adminUser())!.username;
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
    if (
      b.note !== undefined &&
      (typeof b.note !== "string" || !b.note.trim() || b.note.length > 3000)
    )
      throw Error("Use a note of 1–3000 characters.");
    await db().begin(async (sql) => {
      const rows =
        await sql`SELECT status,payment_method FROM orders WHERE id=${b.id} FOR UPDATE`;
      if (!rows.length) throw Error("Order not found.");
      if (b.status === "cancelled") {
        if (
          rows[0].payment_method !== "cod" ||
          !["confirmed", "processing"].includes(rows[0].status)
        )
          throw Error(
            "Only unshipped COD orders can be cancelled here. Card refunds require the payment provider.",
          );
        const items =
          await sql`SELECT product_id,quantity FROM order_items WHERE order_id=${b.id} ORDER BY product_id`;
        for (const i of items) {
          await sql`UPDATE products SET stock=stock+${i.quantity} WHERE id=${i.product_id}`;
          const p =
            await sql`SELECT stock FROM products WHERE id=${i.product_id}`;
          await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,reference,actor) VALUES(${i.product_id},${i.quantity},${p[0].stock},'COD order cancelled',${b.id},${actor})`;
        }
      } else if (b.status) {
        const previous: Record<string, string[]> = {
          processing: ["confirmed", "paid"],
          shipped: ["processing"],
          delivered: ["shipped"],
        };
        if (!previous[b.status]?.includes(rows[0].status))
          throw Error("Invalid status transition.");
      }
      if (b.status) {
        await sql`UPDATE orders SET status=${b.status},updated_at=now() WHERE id=${b.id}`;
        await sql`INSERT INTO order_events(order_id,status) VALUES(${b.id},${b.status})`;
      }
      if (b.trackingNumber !== undefined)
        await sql`UPDATE orders SET tracking_number=${b.trackingNumber},tracking_url=${b.trackingUrl || ""},updated_at=now() WHERE id=${b.id}`;
      if (b.note)
        await sql`INSERT INTO order_notes(order_id,note,actor) VALUES(${b.id},${b.note.trim()},${actor})`;
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Order update failed.",
      },
      { status: 400 },
    );
  }
}

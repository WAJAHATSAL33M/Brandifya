import { randomUUID } from "node:crypto";
import { db } from "../../../../lib/db";
import { adminAuthorized, adminUser } from "../../../../lib/admin-auth";
import { integer, text } from "../../../../lib/admin-input";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows =
      await db()`SELECT * FROM purchase_orders ORDER BY created_at DESC LIMIT 200`;
    const purchases = await Promise.all(
      rows.map(async (p) => ({
        ...p,
        items:
          await db()`SELECT i.*,p.name FROM purchase_order_items i JOIN products p ON p.id=i.product_id WHERE purchase_id=${p.id}`,
      })),
    );
    return Response.json(
      { purchases },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Purchasing unavailable. Apply database/admin-workspace.sql." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json(),
      actor = (await adminUser())!.username;
    await db().begin(async (sql) => {
      if (b.action === "create") {
        const supplier = text(b.supplier, "supplier", 200, true),
          notes = text(b.notes || "", "notes", 3000),
          id = randomUUID();
        if (!Array.isArray(b.items) || !b.items.length || b.items.length > 100)
          throw Error("Add 1–100 purchase lines.");
        const ids = new Set<number>();
        const items = b.items
          .map((i: Record<string, unknown>) => {
            const product = integer(i.productId, "product", 1);
            if (ids.has(product)) throw Error("Duplicate product.");
            ids.add(product);
            return {
              id: product,
              qty: integer(i.quantity, "quantity", 1, 1000000),
              cost: integer(i.costMinor, "cost"),
            };
          })
          .sort((a: { id: number }, b: { id: number }) => a.id - b.id);
        if (b.expectedAt && !/^\d{4}-\d{2}-\d{2}$/.test(b.expectedAt))
          throw Error("Invalid expected date.");
        await sql`INSERT INTO purchase_orders(id,supplier,expected_at,notes) VALUES(${id},${supplier},${b.expectedAt || null},${notes})`;
        for (const i of items)
          await sql`INSERT INTO purchase_order_items(purchase_id,product_id,quantity,cost_minor) VALUES(${id},${i.id},${i.qty},${i.cost})`;
      } else {
        const rows =
          await sql`SELECT status,supplier FROM purchase_orders WHERE id=${String(b.id)} FOR UPDATE`;
        if (!rows.length || rows[0].status !== "ordered")
          throw Error("This purchase order is no longer open.");
        if (b.action === "cancel") {
          await sql`UPDATE purchase_orders SET status='cancelled' WHERE id=${String(b.id)}`;
          return;
        }
        if (b.action !== "receive") throw Error("Invalid action.");
        const items =
          await sql`SELECT * FROM purchase_order_items WHERE purchase_id=${String(b.id)} ORDER BY product_id`;
        for (const i of items) {
          const p =
            await sql`SELECT stock FROM products WHERE id=${i.product_id} FOR UPDATE`;
          const after = Number(p[0].stock) + Number(i.quantity);
          if (after > 100000000) throw Error("Stock limit exceeded.");
          await sql`UPDATE products SET stock=${after} WHERE id=${i.product_id}`;
          await sql`INSERT INTO product_inventory(product_id,cost_minor,supplier) VALUES(${i.product_id},${i.cost_minor},${rows[0].supplier}) ON DUPLICATE KEY UPDATE cost_minor=VALUES(cost_minor),updated_at=now()`;
          await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,reference,actor) VALUES(${i.product_id},${i.quantity},${after},'Purchase received',${String(b.id)},${actor})`;
        }
        await sql`UPDATE purchase_orders SET status='received',received_at=now() WHERE id=${String(b.id)}`;
      }
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Purchase could not be saved. Check product IDs and schema.",
      },
      { status: 400 },
    );
  }
}

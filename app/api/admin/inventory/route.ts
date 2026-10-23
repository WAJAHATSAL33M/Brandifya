import { db } from "../../../../lib/db";
import { adminAuthorized, adminUser } from "../../../../lib/admin-auth";
import { integer, text } from "../../../../lib/admin-input";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const products =
      await db()`SELECT p.id,p.name,p.stock,p.active,p.category,p.price_minor,p.currency,p.image,i.sku,i.supplier,i.location,coalesce(i.cost_minor,0) AS cost_minor,coalesce(i.reorder_level,3) AS reorder_level FROM products p LEFT JOIN product_inventory i ON i.product_id=p.id ORDER BY p.name`;
    const movements =
      await db()`SELECT m.*,p.name FROM inventory_movements m JOIN products p ON p.id=m.product_id ORDER BY m.id DESC LIMIT 200`;
    return Response.json(
      { products, movements },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Inventory unavailable. Apply database/admin-workspace.sql." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json(),
      id = integer(b.id, "product", 1),
      actor = (await adminUser())!.username;
    await db().begin(async (sql) => {
      const rows =
        await sql`SELECT stock FROM products WHERE id=${id} FOR UPDATE`;
      if (!rows.length) throw Error("Product not found.");
      if (b.action === "adjust") {
        const delta = integer(b.delta, "stock change", -1000000, 1000000);
        if (!delta) throw Error("Stock change cannot be zero.");
        const reason = text(b.reason, "reason", 300, true),
          after = Number(rows[0].stock) + delta;
        if (after < 0 || after > 100000000)
          throw Error("Stock cannot become negative or exceed the limit.");
        await sql`UPDATE products SET stock=${after} WHERE id=${id}`;
        await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,reference,actor) VALUES(${id},${delta},${after},${reason},${text(b.reference || "", "reference", 100)},${actor})`;
      } else if (b.action === "details") {
        const sku = text(b.sku, "SKU", 100) || null,
          supplier = text(b.supplier, "supplier", 200),
          location = text(b.location, "location", 120),
          cost = integer(b.costMinor, "cost"),
          level = integer(b.reorderLevel, "reorder level", 0, 1000000);
        await sql`INSERT INTO product_inventory(product_id,sku,supplier,location,cost_minor,reorder_level) VALUES(${id},${sku},${supplier},${location},${cost},${level}) ON DUPLICATE KEY UPDATE sku=VALUES(sku),supplier=VALUES(supplier),location=VALUES(location),cost_minor=VALUES(cost_minor),reorder_level=VALUES(reorder_level),updated_at=now()`;
      } else throw Error("Invalid inventory action.");
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Inventory save failed. Check schema and unique SKU.",
      },
      { status: 400 },
    );
  }
}

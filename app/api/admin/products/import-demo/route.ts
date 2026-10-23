import { db } from "../../../../../lib/db";
import { adminAuthorized, adminUser } from "../../../../../lib/admin-auth";
import { products } from "../../../../../lib/catalog";
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.STORE_LIVE === "true")
    return Response.json(
      {
        error:
          "Demo import is disabled for live stores. Add real products instead.",
      },
      { status: 400 },
    );
  try {
    const actor = (await adminUser())!.username;
    let created = 0;
    await db().begin(async (sql) => {
      await sql.lock("catalog-write");
      await sql.lock("product-id");
      for (const p of products) {
        const exists = await sql`SELECT id FROM products WHERE id=${p.id}`;
        if (exists.length) continue;
        await sql`INSERT INTO products(id,name,description,category,image,color,price_minor,original_price_minor,currency,stock,active,badge,media,attributes) VALUES(${p.id},${p.name},${p.description},${p.category},${p.image},${p.color},${Math.round(p.price * 100)},${p.originalPrice ? Math.round(p.originalPrice * 100) : null},${process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR"},${p.stock},false,${p.badge || ""},${sql.json(p.media || [])},${sql.json(p.attributes || {})})`;
        await sql`INSERT INTO product_details(product_id,tag_ids,status) VALUES(${p.id},'[]','draft')`;
        if (p.stock)
          await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,actor) VALUES(${p.id},${p.stock},${p.stock},'Demo product opening balance',${actor})`;
        created++;
      }
    });
    return Response.json({ ok: true, created });
  } catch {
    return Response.json(
      { error: "Demo import could not finish. Check database setup." },
      { status: 400 },
    );
  }
}

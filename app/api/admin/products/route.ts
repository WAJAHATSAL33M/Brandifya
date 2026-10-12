import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/auth";
import { validateProduct } from "../../../../lib/product-input";
export async function GET(request: Request) {
  if (!adminAuthorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await db()`SELECT * FROM products ORDER BY id`;
    return Response.json(
      { products: rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Products unavailable. Check database setup." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!adminAuthorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const text = await request.text();
    if (text.length > 40000) throw Error("Product is too large.");
    const p = validateProduct(JSON.parse(text));
    if (
      p.id !== null &&
      p.id !== undefined &&
      (!Number.isSafeInteger(p.id) || Number(p.id) < 1)
    )
      throw Error("Invalid product ID.");
    const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR";
    const result = await db().begin(async (sql) => {
      await sql`SELECT pg_advisory_xact_lock(284733)`;
      let id = p.id;
      if (!id) {
        const rows =
          await sql`SELECT coalesce(max(id),0)+1 AS id FROM products`;
        id = rows[0].id;
      } else {
        const rows = await sql`SELECT id FROM products WHERE id=${Number(id)}`;
        if (!rows.length) throw Error("Product not found.");
      }
      const rows =
        await sql`INSERT INTO products (id,name,price_minor,original_price_minor,currency,stock,category,image,color,description,active,badge,rating,review_count,sold_count,promotion_active,promotion_starts_at,promotion_ends_at,media,attributes)
VALUES (${Number(id)},${String(p.name)},${Number(p.priceMinor)},${p.originalPriceMinor == null ? null : Number(p.originalPriceMinor)},${currency},${Number(p.stock)},${String(p.category).trim()},${String(p.image)},${String(p.color)},${String(p.description)},${Boolean(p.active)},${String(p.badge)},${p.rating == null ? null : Number(p.rating)},${Number(p.reviewCount)},${Number(p.soldCount)},${Boolean(p.promotionActive)},${p.promotionStartsAt ? new Date(String(p.promotionStartsAt)) : null},${p.promotionEndsAt ? new Date(String(p.promotionEndsAt)) : null},${sql.json(p.media as never)},${sql.json(p.attributes as never)})
ON CONFLICT(id) DO UPDATE SET name=excluded.name,price_minor=excluded.price_minor,original_price_minor=excluded.original_price_minor,stock=excluded.stock,category=excluded.category,image=excluded.image,color=excluded.color,description=excluded.description,active=excluded.active,badge=excluded.badge,rating=excluded.rating,review_count=excluded.review_count,sold_count=excluded.sold_count,promotion_active=excluded.promotion_active,promotion_starts_at=excluded.promotion_starts_at,promotion_ends_at=excluded.promotion_ends_at,media=excluded.media,attributes=excluded.attributes RETURNING id`;
      return rows[0];
    });
    return Response.json({ ok: true, id: result.id });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error &&
          !/postgres|column|relation|constraint/i.test(e.message)
            ? e.message
            : "Product could not be saved. Check database setup.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!adminAuthorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!Number.isSafeInteger(id) || id < 1) throw Error();
    const rows =
      await db()`UPDATE products SET active=false WHERE id=${id} RETURNING id`;
    return rows.length
      ? Response.json({ ok: true })
      : Response.json({ error: "Product not found" }, { status: 404 });
  } catch {
    return Response.json(
      { error: "Product could not be archived." },
      { status: 400 },
    );
  }
}

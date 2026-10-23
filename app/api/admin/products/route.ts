import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/auth";
import { validateProduct } from "../../../../lib/product-input";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
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
  if (!(await adminAuthorized(request)))
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
      await sql.lock("product-id");
      let id = p.id;
      if (!id) {
        const rows =
          await sql`SELECT coalesce(max(id),0)+1 AS id FROM products`;
        id = rows[0].id;
      } else {
        const rows = await sql`SELECT id FROM products WHERE id=${Number(id)}`;
        if (!rows.length) throw Error("Product not found.");
      }
      await sql`INSERT INTO products (id,name,price_minor,original_price_minor,currency,stock,category,image,color,description,active,badge,rating,review_count,sold_count,promotion_active,promotion_starts_at,promotion_ends_at,media,attributes)
VALUES (${Number(id)},${String(p.name)},${Number(p.priceMinor)},${p.originalPriceMinor == null ? null : Number(p.originalPriceMinor)},${currency},${Number(p.stock)},${String(p.category).trim()},${String(p.image)},${String(p.color)},${String(p.description)},${Boolean(p.active)},${String(p.badge)},${p.rating == null ? null : Number(p.rating)},${Number(p.reviewCount)},${Number(p.soldCount)},${Boolean(p.promotionActive)},${p.promotionStartsAt ? new Date(String(p.promotionStartsAt)) : null},${p.promotionEndsAt ? new Date(String(p.promotionEndsAt)) : null},${sql.json(p.media as never)},${sql.json(p.attributes as never)})
ON DUPLICATE KEY UPDATE name=VALUES(name),price_minor=VALUES(price_minor),original_price_minor=VALUES(original_price_minor),stock=VALUES(stock),category=VALUES(category),image=VALUES(image),color=VALUES(color),description=VALUES(description),active=VALUES(active),badge=VALUES(badge),rating=VALUES(rating),review_count=VALUES(review_count),sold_count=VALUES(sold_count),promotion_active=VALUES(promotion_active),promotion_starts_at=VALUES(promotion_starts_at),promotion_ends_at=VALUES(promotion_ends_at),media=VALUES(media),attributes=VALUES(attributes)`;
      return { id: Number(id) };
    });
    return Response.json({ ok: true, id: result.id });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error &&
          !/mysql|database|postgres|column|relation|constraint/i.test(e.message)
            ? e.message
            : "Product could not be saved. Check database setup.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await request.json();
    if (!Number.isSafeInteger(id) || id < 1) throw Error();
    const rows =
      await db()`UPDATE products SET active=false WHERE id=${id}`;
    return rows.count > 0
      ? Response.json({ ok: true })
      : Response.json({ error: "Product not found" }, { status: 404 });
  } catch {
    return Response.json(
      { error: "Product could not be archived." },
      { status: 400 },
    );
  }
}

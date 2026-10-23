import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/auth";
import { adminUser } from "../../../../lib/admin-auth";
import { validateDetails } from "../../../../lib/product-details";
import { validateProduct } from "../../../../lib/product-input";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows =
      await db()`SELECT p.*,d.category_id,d.brand_id,d.tag_ids,d.vendor,d.barcode,d.weight_grams,d.requires_shipping,d.seo_title,d.seo_description,
CASE WHEN p.active THEN 'active' WHEN d.status='archived' THEN 'archived' ELSE 'draft' END AS product_status,
b.name AS brand_name,i.sku,i.supplier,i.location,coalesce(i.cost_minor,0) AS cost_minor,coalesce(i.reorder_level,3) AS reorder_level
FROM products p LEFT JOIN product_details d ON d.product_id=p.id LEFT JOIN catalog_terms b ON b.id=d.brand_id LEFT JOIN product_inventory i ON i.product_id=p.id ORDER BY p.id DESC`;
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
    if (text.length > 80000) throw Error("Product is too large.");
    const p = validateProduct(JSON.parse(text));
    const details = validateDetails(p);
    if (
      p.id !== null &&
      p.id !== undefined &&
      (!Number.isSafeInteger(p.id) || Number(p.id) < 1)
    )
      throw Error("Invalid product ID.");
    const actor = (await adminUser())!.username;
    const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR";
    const result = await db().begin(async (sql) => {
      await sql.lock("catalog-write");
      await sql.lock("product-id");
      if (details.organization) {
        const o = details.organization;
        if (
          (o.status === "active" && !p.active) ||
          (o.status !== "active" && p.active)
        )
          throw Error("Product visibility does not match its status.");
        for (const [termId, kind] of [
          [o.categoryId, "category"],
          [o.brandId, "brand"],
          ...o.tagIds.map((id) => [id, "tag"]),
        ]) {
          if (termId == null) continue;
          const terms =
            await sql`SELECT name FROM catalog_terms WHERE id=${termId} AND kind=${kind} AND active=true FOR UPDATE`;
          if (!terms.length)
            throw Error(
              "A selected category, brand or tag is unavailable. Choose an active record.",
            );
          if (kind === "category") p.category = terms[0].name;
        }
      }
      let id = p.id;
      let previousStock = 0;
      if (!id) {
        const rows =
          await sql`SELECT coalesce(max(id),0)+1 AS id FROM products`;
        id = rows[0].id;
      } else {
        const rows =
          await sql`SELECT id,stock FROM products WHERE id=${Number(id)} FOR UPDATE`;
        if (!rows.length) throw Error("Product not found.");
        previousStock = Number(rows[0].stock);
        if (
          p.expectedStock !== undefined &&
          Number(p.expectedStock) !== previousStock
        )
          throw Error(
            "Stock changed since you opened this product. Reopen it before saving.",
          );
      }
      await sql`INSERT INTO products (id,name,price_minor,original_price_minor,currency,stock,category,image,color,description,active,badge,rating,review_count,sold_count,promotion_active,promotion_starts_at,promotion_ends_at,media,attributes)
VALUES (${Number(id)},${String(p.name)},${Number(p.priceMinor)},${p.originalPriceMinor == null ? null : Number(p.originalPriceMinor)},${currency},${Number(p.stock)},${String(p.category).trim()},${String(p.image)},${String(p.color)},${String(p.description)},${Boolean(p.active)},${String(p.badge)},${p.rating == null ? null : Number(p.rating)},${Number(p.reviewCount)},${Number(p.soldCount)},${Boolean(p.promotionActive)},${p.promotionStartsAt ? new Date(String(p.promotionStartsAt)) : null},${p.promotionEndsAt ? new Date(String(p.promotionEndsAt)) : null},${sql.json(p.media as never)},${sql.json(p.attributes as never)})
ON DUPLICATE KEY UPDATE name=VALUES(name),price_minor=VALUES(price_minor),original_price_minor=VALUES(original_price_minor),stock=VALUES(stock),category=VALUES(category),image=VALUES(image),color=VALUES(color),description=VALUES(description),active=VALUES(active),badge=VALUES(badge),rating=VALUES(rating),review_count=VALUES(review_count),sold_count=VALUES(sold_count),promotion_active=VALUES(promotion_active),promotion_starts_at=VALUES(promotion_starts_at),promotion_ends_at=VALUES(promotion_ends_at),media=VALUES(media),attributes=VALUES(attributes)`;
      if (previousStock !== Number(p.stock))
        await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,actor) VALUES(${Number(id)},${Number(p.stock) - previousStock},${Number(p.stock)},'Product editor stock update',${actor})`;
      if (details.organization) {
        const o = details.organization;
        await sql`INSERT INTO product_details(product_id,category_id,brand_id,tag_ids,status,vendor,barcode,weight_grams,requires_shipping,seo_title,seo_description) VALUES(${Number(id)},${o.categoryId},${o.brandId},${sql.json(o.tagIds)},${o.status},${o.vendor},${o.barcode},${o.weightGrams},${o.requiresShipping},${o.seoTitle},${o.seoDescription}) ON DUPLICATE KEY UPDATE category_id=VALUES(category_id),brand_id=VALUES(brand_id),tag_ids=VALUES(tag_ids),status=VALUES(status),vendor=VALUES(vendor),barcode=VALUES(barcode),weight_grams=VALUES(weight_grams),requires_shipping=VALUES(requires_shipping),seo_title=VALUES(seo_title),seo_description=VALUES(seo_description),updated_at=now()`;
      }
      if (details.inventory) {
        const i = details.inventory;
        if (i.sku) {
          const duplicate =
            await sql`SELECT product_id FROM product_inventory WHERE sku=${i.sku} AND product_id!=${Number(id)} FOR UPDATE`;
          if (duplicate.length)
            throw Error(
              "This SKU is already assigned to another product. Use a unique SKU.",
            );
        }
        await sql`INSERT INTO product_inventory(product_id,sku,supplier,location,cost_minor,reorder_level) VALUES(${Number(id)},${i.sku},${i.supplier},${i.location},${i.costMinor},${i.reorderLevel}) ON DUPLICATE KEY UPDATE sku=VALUES(sku),supplier=VALUES(supplier),location=VALUES(location),cost_minor=VALUES(cost_minor),reorder_level=VALUES(reorder_level),updated_at=now()`;
      }
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
    const rows = await db().begin(async (sql) => {
      await sql.lock("catalog-write");
      const found =
        await sql`SELECT id FROM products WHERE id=${id} FOR UPDATE`;
      if (!found.length) return found;
      await sql`UPDATE products SET active=false WHERE id=${id}`;
      await sql`INSERT INTO product_details(product_id,tag_ids,status) VALUES(${id},'[]','archived') ON DUPLICATE KEY UPDATE status='archived',updated_at=now()`;
      return found;
    });
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

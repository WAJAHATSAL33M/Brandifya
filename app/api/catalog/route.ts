import { storefrontDescription } from "../../../lib/storefront-description";
import { products } from "../../../lib/catalog";
import { db, databaseConfigured } from "../../../lib/db";
export async function GET() {
  if (!databaseConfigured())
    return Response.json({ live: false, managed: false, products });
  try {
    const rows =
      await db()`SELECT p.*,b.name AS brand_name,d.tag_ids FROM products p LEFT JOIN product_details d ON d.product_id=p.id LEFT JOIN catalog_terms b ON b.id=d.brand_id AND b.active=true WHERE p.active=true ORDER BY p.id`;
    const tagRows =
      await db()`SELECT id,name FROM catalog_terms WHERE kind='tag' AND active=true`;
    const tagNames = new Map(
      tagRows.map((t) => [Number(t.id), String(t.name)]),
    );
    return Response.json(
      {
        live: process.env.STORE_LIVE === "true",
        managed: true,
        products: rows.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand_name || undefined,
          tags: Array.isArray(p.tag_ids)
            ? p.tag_ids.map((id: number) => tagNames.get(id)).filter(Boolean)
            : [],
          category: p.category,
          price: p.price_minor / 100,
          originalPrice:
            p.original_price_minor == null
              ? null
              : p.original_price_minor / 100,
          stock: p.stock,
          image: p.image,
          color: p.color,
          description: storefrontDescription(p.description),
          badge: p.badge || undefined,
          media: Array.isArray(p.media) ? p.media : [],
          attributes: p.attributes || {},
          rating: p.rating == null ? undefined : Number(p.rating),
          reviewCount: p.review_count ?? undefined,
          soldCount: p.sold_count ?? undefined,
          promotionActive: p.promotion_active === true,
          promotionStartsAt: p.promotion_starts_at
            ? new Date(p.promotion_starts_at).toISOString()
            : null,
          promotionEndsAt: p.promotion_ends_at
            ? new Date(p.promotion_ends_at).toISOString()
            : null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Inventory unavailable" }, { status: 503 });
  }
}

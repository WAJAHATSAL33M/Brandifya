import { products } from "../../../lib/catalog";
import { db, databaseConfigured } from "../../../lib/db";
export async function GET() {
  if (!databaseConfigured())
    return Response.json({ live: false, managed: false, products });
  try {
    const rows =
      await db()`SELECT * FROM products WHERE active=true ORDER BY id`;
    return Response.json(
      {
        live: process.env.STORE_LIVE === "true",
        managed: true,
        products: rows.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price_minor / 100,
          originalPrice:
            p.original_price_minor == null
              ? null
              : p.original_price_minor / 100,
          stock: p.stock,
          image: p.image,
          color: p.color,
          description: p.description,
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

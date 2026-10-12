import { products } from "../../../lib/catalog";
import { db } from "../../../lib/db";
export async function GET() {
  if (process.env.STORE_LIVE !== "true")
    return Response.json({ live: false, products });
  try {
    const rows =
      await db()`SELECT * FROM products WHERE active=true ORDER BY id`;
    return Response.json(
      {
        live: true,
        products: rows.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price_minor / 100,
          stock: p.stock,
          image: p.image,
          color: p.color,
          description: p.description,
          badge: p.badge || undefined,
          rating: p.rating == null ? undefined : Number(p.rating),
          reviewCount: p.review_count ?? undefined,
          soldCount: p.sold_count ?? undefined,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Inventory unavailable" }, { status: 503 });
  }
}


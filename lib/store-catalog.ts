import { products, type Product } from "./catalog";
import { referenceProducts } from "./reference-catalog";
import { db } from "./db";
export async function findProduct(id: number): Promise<Product | undefined> {
  if (process.env.STORE_LIVE !== "true")
    return [...products, ...referenceProducts].find((p) => p.id === id);
  const rows =
    await db()`SELECT * FROM products WHERE id=${id} AND active=true`;
  const p = rows[0];
  return p
    ? {
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
      }
    : undefined;
}

export async function categoryNames(): Promise<string[]> {
  const { categories } = await import("./catalog");
  const known = categories.filter((name) => name !== "All finds");
  if (process.env.STORE_LIVE !== "true")
    return [...new Set([...known, ...products.map((p) => p.category)])];
  try {
    const rows =
      await db()`SELECT DISTINCT category FROM products WHERE active=true ORDER BY category`;
    return [...new Set([...known, ...rows.map((p) => String(p.category))])];
  } catch {
    return known;
  }
}

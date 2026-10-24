import { storefrontDescription } from "./storefront-description";
import { products, type Product } from "./catalog";
import { referenceProducts } from "./reference-catalog";
import { db, databaseConfigured } from "./db";
export async function findProduct(id: number): Promise<Product | undefined> {
  if (!databaseConfigured())
    return [...products, ...referenceProducts].find((p) => p.id === id);
  const rows =
    await db()`SELECT p.*,b.name AS brand_name,d.tag_ids,d.seo_title,d.seo_description FROM products p LEFT JOIN product_details d ON d.product_id=p.id LEFT JOIN catalog_terms b ON b.id=d.brand_id AND b.active=true WHERE p.id=${id} AND p.active=true`;
  const p = rows[0];
  return p
    ? {
        id: p.id,
        name: p.name,
        brand: p.brand_name || undefined,
        seoTitle: p.seo_title || undefined,
        seoDescription: p.seo_description || undefined,
        category: p.category,
        price: p.price_minor / 100,
        originalPrice:
          p.original_price_minor == null ? null : p.original_price_minor / 100,
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
      }
    : undefined;
}

export async function categoryNames(): Promise<string[]> {
  const { categories } = await import("./catalog");
  const known = categories.filter((name) => name !== "All finds");
  if (!databaseConfigured())
    return [...new Set([...known, ...products.map((p) => p.category)])];
  try {
    const rows =
      await db()`SELECT DISTINCT category FROM products WHERE active=true ORDER BY category`;
    return [...new Set([...known, ...rows.map((p) => String(p.category))])];
  } catch {
    return known;
  }
}

export async function managedCategory(slug: string) {
  if (!databaseConfigured()) return null;
  const rows =
    await db()`SELECT name,slug,image,description FROM catalog_terms WHERE kind='category' AND active=true AND (slug=${slug} OR name=${slug}) LIMIT 1`;
  return rows[0] || null;
}

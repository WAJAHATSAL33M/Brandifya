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
      }
    : undefined;
}

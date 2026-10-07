import { timingSafeEqual } from "node:crypto";
import { db } from "../../../../lib/db";
function authorized(request: Request) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || token.length < 32) return false;
  const a = Buffer.from(request.headers.get("authorization") || ""),
    b = Buffer.from(`Bearer ${token}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: Request) {
  if (!authorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const p = await request.json();
    if (
      !Number.isSafeInteger(p.id) ||
      p.id < 1 ||
      !Number.isSafeInteger(p.priceMinor) ||
      p.priceMinor < 1 ||
      !Number.isSafeInteger(p.stock) ||
      p.stock < 0 ||
      p.stock > 100000 ||
      typeof p.name !== "string" ||
      p.name.length > 200 ||
      !p.name.trim() ||
      typeof p.description !== "string" ||
      p.description.length > 5000 ||
      typeof p.image !== "string" ||
      !/^(photo-[\w-]+|\/product-[1-8]\.jpg)$/.test(p.image) ||
      typeof p.color !== "string" ||
      p.color.length > 100 ||
      ![
        "Home & Living",
        "Fashion",
        "Tech",
        "Beauty",
        "Accessories",
        "Grocery",
        "Sports & Fitness",
      ].includes(p.category) ||
      typeof p.active !== "boolean"
    )
      return Response.json(
        {
          error:
            "Invalid product fields. Prices must use integer minor units; image is an Unsplash photo ID.",
        },
        { status: 400 },
      );
    const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR";
    await db()`INSERT INTO products (id,name,price_minor,currency,stock,category,image,color,description,active) VALUES (${p.id},${p.name},${p.priceMinor},${currency},${p.stock},${p.category},${p.image},${p.color},${p.description},${p.active}) ON CONFLICT(id) DO UPDATE SET name=excluded.name,price_minor=excluded.price_minor,currency=excluded.currency,stock=excluded.stock,category=excluded.category,image=excluded.image,color=excluded.color,description=excluded.description,active=excluded.active`;
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Product could not be saved" },
      { status: 503 },
    );
  }
}

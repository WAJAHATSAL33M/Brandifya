export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  color: string;
  description: string;
  badge?: string;
  stock: number;
};
export const products: Product[] = [
  {
    id: 1,
    name: "Vintage leather backpack",
    category: "Accessories",
    price: 12900,
    image: "/product-1.jpg",
    color: "Cognac",
    description:
      "A leather backpack concept with a vintage silhouette. Dimensions and materials must be verified before sale.",
    badge: "Featured",
    stock: 8,
  },
  {
    id: 2,
    name: "Ceramic aroma diffuser",
    category: "Home & Living",
    price: 6900,
    image: "/product-2.jpg",
    color: "Natural",
    description:
      "A ceramic diffuser concept for your home. Capacity, power requirements, and care instructions require merchant verification.",
    badge: "New",
    stock: 12,
  },
  {
    id: 3,
    name: "Smart fitness band",
    category: "Tech",
    price: 4200,
    image: "/product-3.jpg",
    color: "Black",
    description:
      "An everyday fitness band concept. Features, compatibility, and warranty must be confirmed before sale.",
    stock: 6,
  },
  {
    id: 4,
    name: "Everyday tote bag",
    category: "Accessories",
    price: 8900,
    image: "/product-4.jpg",
    color: "Cream",
    description:
      "An everyday tote concept with a neutral finish. Size and material information must be confirmed before sale.",
    badge: "Featured",
    stock: 9,
  },
  {
    id: 5,
    name: "Electric kettle",
    category: "Home & Living",
    price: 7500,
    image: "/product-5.jpg",
    color: "Black",
    description:
      "A countertop kettle concept. Capacity, voltage, safety certification, and warranty require merchant verification.",
    stock: 4,
  },
  {
    id: 6,
    name: "Skincare serum set",
    category: "Beauty",
    price: 11900,
    image: "/product-6.jpg",
    color: "Natural",
    description:
      "A skincare set concept. Final ingredients, product labels, and suitability information must be supplied before sale.",
    stock: 7,
  },
  {
    id: 7,
    name: "Casual loafers",
    category: "Fashion",
    price: 3500,
    image: "/product-7.jpg",
    color: "Sand",
    description:
      "A casual loafer concept in a neutral finish. Size variants, materials, and fit information must be supplied before sale.",
    badge: "New",
    stock: 10,
  },
  {
    id: 8,
    name: "Portable Bluetooth speaker",
    category: "Tech",
    price: 5900,
    image: "/product-8.jpg",
    color: "Charcoal",
    description:
      "A portable speaker concept. Battery life, compatibility, and warranty must be verified before sale.",
    stock: 5,
  },
];
export const categories = [
  "All finds",
  "Home & Living",
  "Fashion",
  "Tech",
  "Beauty",
  "Accessories",
  "Grocery",
  "Sports & Fitness",
];
export const money = (value: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR",
    maximumFractionDigits: 0,
  }).format(value);
export type CartItem = { id: number; quantity: number };
export function sanitizeCart(
  input: unknown,
  catalog: Product[] = products,
): CartItem[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<number>();
  return input.flatMap((item) => {
    const p = catalog.find((p) => p.id === item?.id);
    if (
      !p ||
      p.stock < 1 ||
      seen.has(p.id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    )
      return [];
    seen.add(p.id);
    return [{ id: p.id, quantity: Math.min(item.quantity, p.stock) }];
  });
}
export function subtotal(cart: CartItem[], catalog: Product[] = products) {
  return cart.reduce(
    (sum, item) =>
      sum + (catalog.find((p) => p.id === item.id)?.price ?? 0) * item.quantity,
    0,
  );
}

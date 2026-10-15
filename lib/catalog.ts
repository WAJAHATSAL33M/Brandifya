export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  media?: { type: "image" | "video"; url: string; alt: string }[];
  attributes?: Record<string, string>;
  image: string;
  color: string;
  description: string;
  badge?: string;
  stock: number;
  rating?: number | null;
  reviewCount?: number;
  soldCount?: number;
  promotionActive?: boolean;
  promotionStartsAt?: string | null;
  promotionEndsAt?: string | null;
};
export const products: Product[] = [
  {
    id: 1,
    badge: "Featured",
    name: "Vintage leather backpack with classic front pockets for everyday essentials",
    category: "Accessories",
    price: 12900,
    originalPrice: 15900,
    image: "/products/featured0.webp",
    color: "Cognac",
    description:
      "A leather backpack concept with a vintage silhouette. Dimensions and materials must be verified before sale.",
    stock: 8,
  },
  {
    id: 2,
    badge: "New",
    name: "Ceramic aroma diffuser in a natural finish for everyday home styling",
    category: "Home & Living",
    price: 6900,
    originalPrice: 8900,
    image: "/products/featured1.webp",
    color: "Natural",
    description:
      "A ceramic diffuser concept for your home. Capacity, power requirements, and care instructions require merchant verification.",
    stock: 12,
  },
  {
    id: 3,
    badge: "Top Rated",
    name: "Smart fitness band",
    category: "Tech",
    price: 4200,
    image: "/products/featured2.webp",
    color: "Black",
    description:
      "An everyday fitness band concept. Features, compatibility, and warranty must be confirmed before sale.",
    stock: 6,
  },
  {
    id: 4,
    badge: "Best Seller",
    name: "Everyday tote bag",
    category: "Accessories",
    price: 8900,
    image: "/products/featured3.webp",
    color: "Cream",
    description:
      "An everyday tote concept with a neutral finish. Size and material information must be confirmed before sale.",
    stock: 9,
  },
  {
    id: 5,
    badge: "Few Left",
    name: "Electric kettle",
    category: "Home & Living",
    price: 7500,
    image: "/products/featured4.webp",
    color: "Black",
    description:
      "A countertop kettle concept. Capacity, voltage, safety certification, and warranty require merchant verification.",
    stock: 3,
  },
  {
    id: 6,
    badge: "Countdown Timer",
    promotionActive: true,
    promotionStartsAt: "2026-10-14T00:00:00Z",
    promotionEndsAt: "2026-10-15T23:59:59Z",
    name: "Skincare serum set",
    category: "Beauty",
    price: 11900,
    originalPrice: 14900,
    image: "/products/featured5.webp",
    color: "Natural",
    description:
      "A skincare set concept. Final ingredients, product labels, and suitability information must be supplied before sale.",
    stock: 7,
  },
  {
    id: 7,
    badge: "Lightning Deal",
    promotionActive: true,
    promotionStartsAt: "2026-10-14T00:00:00Z",
    promotionEndsAt: "2026-10-15T23:59:59Z",
    name: "Casual loafers",
    category: "Fashion",
    price: 3500,
    image: "/products/featured6.webp",
    color: "Sand",
    description:
      "A casual loafer concept in a neutral finish. Size variants, materials, and fit information must be supplied before sale.",
    stock: 10,
  },
  {
    id: 8,
    badge: "Trending",
    name: "Portable Bluetooth speaker in charcoal for everyday listening at home and on the go",
    category: "Tech",
    price: 5900,
    image: "/products/featured7.webp",
    color: "Charcoal",
    description:
      "A portable speaker concept. Battery life, compatibility, and warranty must be verified before sale.",
    stock: 5,
  },
].map((p, i) => ({
  ...p,
  rating: [4.4, 4.7, 4.5, 4.6, 4.3, 4.8, 4.5, 4.6][i],
  reviewCount: 120 + i * 37,
  soldCount: 5300 + i * 170,
}));
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


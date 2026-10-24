export type Product = {
  brand?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
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
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
    badge: "Featured",
    name: "Vintage Leather Backpack with Classic Front Pockets for Everyday Essentials, Commuting, Travel and Casual Weekend Outings",
    category: "Accessories",
    price: 12900,
    originalPrice: 15900,
    image: "/products/featured0.webp",
    color: "Cognac",
    description:
      "A backpack with a vintage silhouette for everyday essentials. Check the product details for dimensions and care information.",
    stock: 8,
  },
  {
    id: 2,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
    badge: "New",
    name: "Ceramic Aroma Diffuser in a Natural Finish for Everyday Home Styling, Relaxing Corners and Thoughtful Interior Arrangements",
    category: "Home",
    price: 6900,
    originalPrice: 8900,
    image: "/products/featured1.webp",
    color: "Natural",
    description:
      "A ceramic diffuser for a comfortable home setting. Contact us for capacity and care information.",
    stock: 12,
  },
  {
    id: 3,
    badge: "Top Rated",
    name: "Smart Fitness Band for Daily Activity Routines, Personal Fitness Planning and Everyday Wear at Home or on the Go",
    category: "Gadgets",
    price: 4200,
    image: "/products/featured2.webp",
    color: "Black",
    description:
      "An everyday fitness band with a simple, wearable design. Check device compatibility before ordering.",
    stock: 6,
  },
  {
    id: 4,
    badge: "Best Seller",
    name: "Everyday Tote Bag in a Cream Finish for Daily Essentials, Shopping Trips, Office Outfits and Casual Weekend Styling",
    category: "Accessories",
    price: 8900,
    image: "/products/featured3.webp",
    color: "Cream",
    description:
      "An everyday tote with a neutral finish. Contact our team for size and material details.",
    stock: 9,
  },
  {
    id: 5,
    badge: "Few Left",
    name: "Electric Countertop Kettle in a Black Finish for Everyday Kitchen Routines, Morning Tea Breaks and Home Coffee Corners",
    category: "Kitchen",
    price: 7500,
    image: "/products/featured4.webp",
    color: "Black",
    description:
      "A countertop kettle for an everyday kitchen setup. Check the product details for capacity and voltage before ordering.",
    stock: 3,
  },
  {
    id: 6,
    badge: "Countdown Timer",
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
    name: "Skincare Serum Set for Everyday Beauty Routines, Personal Care Collections and Thoughtfully Arranged Dressing Tables",
    category: "Beauty",
    price: 11900,
    originalPrice: 14900,
    image: "/products/featured5.webp",
    color: "Natural",
    description:
      "A skincare collection for your daily routine. Check product labels, ingredients and suitability before use.",
    stock: 7,
  },
  {
    id: 7,
    badge: "Lightning Deal",
    promotionActive: true,
    promotionStartsAt: "2026-10-14T00:00:00Z",
    promotionEndsAt: "2026-10-15T23:59:59Z",
    name: "Casual Loafers in a Sand Finish for Everyday Outfit Styling, Relaxed Weekend Looks and Your Seasonal Footwear Collection",
    category: "Fashion",
    price: 3500,
    image: "/products/featured6.webp",
    color: "Sand",
    description:
      "A casual loafer with a neutral finish. Check the available size and fit details before ordering.",
    stock: 10,
  },
  {
    id: 8,
    badge: "Trending",
    name: "Portable Bluetooth Speaker in Charcoal for Everyday Listening at Home, Casual Gatherings and Your On-the-Go Music Collection",
    category: "Tech",
    price: 5900,
    image: "/products/featured7.webp",
    color: "Charcoal",
    description:
      "A portable speaker for your everyday listening setup. Check compatibility and product specifications before ordering.",
    stock: 5,
  },
  {
    id: 9,
    name: "Wireless Over-Ear Headphones",
    category: "Tech",
    price: 13900,
    originalPrice: 18900,
    image: "/products/best0.webp",
    color: "Black",
    description:
      "Over-ear headphones with a clean, cushioned design for a personal listening setup. Check the product page for available details, or contact us with a product question.",
    stock: 20,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 10,
    name: "Everyday Smart Watch with Black Strap",
    category: "Watches",
    price: 17900,
    originalPrice: 24900,
    image: "/products/best1.webp",
    color: "Black",
    description:
      "A square-face watch with a simple black strap for everyday styling. Check the product page for available details, or contact us with a product question.",
    stock: 8,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 11,
    name: "Tan Everyday Tote Handbag",
    category: "Fashion",
    price: 4900,
    originalPrice: 6500,
    image: "/products/best2.webp",
    color: "Tan",
    description:
      "A spacious tote silhouette with two handles and a warm tan finish. Check the product page for available details, or contact us with a product question.",
    stock: 11,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 12,
    name: "Classic White Lace-Up Sneakers",
    category: "Footwear",
    price: 5900,
    originalPrice: 7900,
    image: "/products/best3.webp",
    color: "White",
    description:
      "Low-profile white sneakers with a versatile lace-up design. Check the product page for available details, or contact us with a product question.",
    stock: 14,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 13,
    name: "Natural Ceramic Home Diffuser",
    category: "Home",
    price: 3900,
    originalPrice: 5200,
    image: "/products/best4.webp",
    color: "Natural",
    description:
      "A rounded diffuser design for a bedside table or quiet corner. Check the product page for available details, or contact us with a product question.",
    stock: 17,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 14,
    name: "Tortoiseshell Round Sunglasses",
    category: "Accessories",
    price: 2900,
    originalPrice: 3900,
    image: "/products/best5.webp",
    color: "Tortoiseshell",
    description:
      "Round frames with a patterned finish for an everyday accessories collection. Check the product page for available details, or contact us with a product question.",
    stock: 20,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 15,
    name: "Classic Black Frame Sunglasses",
    category: "Accessories",
    price: 3200,
    originalPrice: 4500,
    image: "/products/deal0.webp",
    color: "Black",
    description:
      "Simple black frames with a timeless everyday silhouette. Check the product page for available details, or contact us with a product question.",
    stock: 8,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 16,
    name: "Wraparound Sports Sunglasses",
    category: "Sports",
    price: 4500,
    originalPrice: 5900,
    image: "/products/deal1.webp",
    color: "Black",
    description:
      "A wraparound frame design for a sporty accessories collection. Check the product page for available details, or contact us with a product question.",
    stock: 11,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 17,
    name: "Tortoiseshell Cat-Eye Sunglasses",
    category: "Fashion",
    price: 2600,
    originalPrice: 3500,
    image: "/products/deal2.webp",
    color: "Tortoiseshell",
    description:
      "A gently upswept cat-eye frame in a warm patterned finish. Check the product page for available details, or contact us with a product question.",
    stock: 14,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 18,
    name: "Travel Shoe Organiser Bags — Set of Two",
    category: "Accessories",
    price: 2900,
    originalPrice: 3900,
    image: "/products/deal3.webp",
    color: "Beige",
    description:
      "Two zippered shoe organisers to separate footwear in your travel luggage. Check the product page for available details, or contact us with a product question.",
    stock: 17,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 19,
    name: "Everyday Sneaker Care Kit",
    category: "Footwear",
    price: 2200,
    originalPrice: 3000,
    image: "/products/deal4.webp",
    color: "Natural",
    description:
      "A shoe-care collection with a brush, cloth and cleaning bottle. Check the product page for available details, or contact us with a product question.",
    stock: 20,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
  {
    id: 20,
    name: "Long-Handle Brass Finish Shoehorn",
    category: "Home",
    price: 1800,
    originalPrice: 2500,
    image: "/products/deal5.webp",
    color: "Brass",
    description:
      "A slim, long-handle shoehorn with a warm metallic finish for an organised entryway. Check the product page for available details, or contact us with a product question.",
    stock: 8,
    promotionActive: true,
    promotionStartsAt: "2026-10-20T00:00:00Z",
    promotionEndsAt: "2026-10-27T23:59:59Z",
  },
].map((p, i) => ({
  ...p,
  rating: [4.4, 4.7, 4.5, 4.6, 4.3, 4.8, 4.5, 4.6][i % 8],
  reviewCount: 120 + i * 37,
  soldCount: 5300 + i * 170,
}));
export const categories = [
  "All finds",
  "Home",
  "Kitchen",
  "Gadgets",
  "Fashion",
  "Tech",
  "Beauty",
  "Accessories",
  "Grocery",
  "Sports",
  "Watches",
  "Footwear",
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

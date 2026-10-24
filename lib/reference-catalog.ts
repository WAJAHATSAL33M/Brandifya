import { dealProducts, bestProducts } from "./home-content";
import type { Product } from "./catalog";
export const referenceProducts: Product[] = [
  ...dealProducts,
  ...bestProducts,
].map((p, i) => ({
  id: -1 - i,
  name: p.name,
  category:
    i < 6
      ? i === 5
        ? "Home"
        : "Accessories"
      : ["Tech", "Tech", "Accessories", "Fashion", "Home", "Accessories"][
          i - 6
        ],
  price: [
    4500, 7900, 3200, 8900, 6900, 12500, 18900, 24900, 5900, 7500, 4200, 9900,
  ][i],
  rating: [4.4, 4.6, 4.5, 4.7][i % 4],
  reviewCount: 80 + i * 23,
  soldCount: 1200 + i * 350,
  image: `/products/${i < 6 ? `deal${i}` : `best${i - 6}`}.webp`,
  color: "",
  description: p.description,
  stock: 0,
  badge: p.badge,
}));

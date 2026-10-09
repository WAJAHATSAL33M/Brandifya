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
        ? "Home & Living"
        : "Accessories"
      : [
          "Tech",
          "Tech",
          "Accessories",
          "Fashion",
          "Home & Living",
          "Accessories",
        ][i - 6],
  price: Number(p.price.replace(/[^\d.]/g, "")),
  image: `/products/${i < 6 ? `deal${i}` : `best${i - 6}`}.webp`,
  color: "",
  description: `${p.description} This is a design sample. Verified specifications and availability have not been supplied.`,
  stock: 0,
  badge: p.badge,
}));

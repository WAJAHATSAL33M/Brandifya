export function categorySlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), "-")
    .replace(/^-|-$/g, "");
}
export const categoryHref = (name: string) =>
  `/category/${encodeURIComponent(categorySlug(name))}`;
export const categoryDesigns: Record<
  string,
  { description: string; image?: string; dark?: boolean }
> = {
  Home: {
    description: "Thoughtful home essentials and decor for a space that feels like you.",
    image: "/heroes/home-tech.webp",
  },
  Kitchen: {
    description: "Explore kitchen appliances and everyday essentials for your cooking and tea-time routines.",
  },
  Gadgets: {
    description: "Discover useful gadgets, wearable tech and portable essentials for everyday life.",
    image: "/heroes/home-tech.webp",
  },
  Sports: {
    description: "Make room for movement. Explore sports essentials as our collection grows.",
  },
  "Home & Living": {
    description:
      "Thoughtful essentials for a space that feels like you. Explore home finds that bring ease to your everyday routine.",
    image: "/heroes/home-tech.webp",
  },
  Fashion: {
    description:
      "Find the pieces that fit your everyday style. Explore the collection and take a closer look at your next favorite.",
    image: "/heroes/fashion.webp",
  },
  Accessories: {
    description:
      "The finishing touches for wherever your day takes you. Discover bags and everyday accessories with a little extra character.",
    image: "/heroes/everyday.webp",
    dark: true,
  },
  Beauty: {
    description:
      "A little care for your everyday routine. Explore beauty essentials and find the details that matter to you.",
    image: "/heroes/shop-beauty.webp",
  },
  Tech: {
    description:
      "Small upgrades for everyday life. Discover audio, wearable tech and useful essentials for your daily routine.",
    image: "/heroes/home-tech.webp",
  },
  Watches: {
    description: "Explore watches and everyday timepieces as our collection grows.",
  },
  Footwear: {
    description: "Discover everyday footwear and find your next pair as new styles arrive.",
  },
  Grocery: {
    description:
      "Explore everyday grocery essentials as our collection grows. Find available products below or discover another collection.",
  },
  "Sports & Fitness": {
    description:
      "Make room for movement. Explore our sports and fitness collection as new essentials become available.",
  },
};


/** Three category-specific frames for each collection hero. */
export const categoryBanners: Record<string, string[]> = {
  Fashion: ["/heroes/fashion.webp", "/promotions/fashion-2.webp", "/promotions/fashion-3.webp"],
  Beauty: ["/heroes/shop-beauty.webp", "/promotions/beauty-2.webp", "/promotions/beauty-3.webp"],
  Tech: ["/heroes/home-tech.webp", "/promotions/tech-2.webp", "/promotions/tech-3.webp"],
  Home: ["/categories/home-decor.webp", "/products/featured1.webp", "/products/best4.webp"],
  Kitchen: ["/categories/home.webp", "/products/featured4.webp", "/category-banners/kitchen-cookware.webp"],
  Gadgets: ["/categories/gadgets.webp", "/products/featured2.webp", "/products/featured7.webp"],
  Sports: ["/category-banners/sports-ball.webp", "/category-banners/sports-racket.webp", "/category-banners/sports-training.webp"],
  Grocery: ["/categories/grocery.webp", "/category-banners/grocery-produce.webp", "/category-banners/grocery-pantry.webp"],
  Watches: ["/categories/fitness.webp", "/products/best1.webp", "/products/featured2.webp"],
  Accessories: ["/products/featured0.webp", "/products/deal0.webp", "/products/best2.webp"],
  Footwear: ["/products/featured6.webp", "/products/best3.webp", "/promotions/fashion-3.webp"],
};
categoryBanners["Home & Living"] = categoryBanners.Home;
categoryBanners["Sports & Fitness"] = categoryBanners.Sports;

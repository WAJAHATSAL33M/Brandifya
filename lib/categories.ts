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
  Grocery: {
    description:
      "Explore everyday grocery essentials as our collection grows. Find available products below or discover another collection.",
  },
  "Sports & Fitness": {
    description:
      "Make room for movement. Explore our sports and fitness collection as new essentials become available.",
  },
};

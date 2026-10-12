import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { categoryNames } from "../../../lib/store-catalog";
import { categorySlug, categoryDesigns } from "../../../lib/categories";
import Shop from "../../shop/shop-client";
import "../../shop/shop.css";
import "../category.css";
type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
const resolveCategory = cache(async (slug: string) =>
  (await categoryNames()).find((name) => categorySlug(name) === slug),
);
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = await resolveCategory(slug);
  return {
    title: name ? `${name} | Brande` : "Category not found | Brande",
    description: name
      ? categoryDesigns[name]?.description ||
        `Explore ${name} at Brande. Search, filter and find your next favorite.`
      : undefined,
  };
}
export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const name = await resolveCategory(slug);
  if (!name) notFound();
  return <Shop key={name} category={name} />;
}

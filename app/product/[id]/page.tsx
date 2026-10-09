import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findProduct } from "../../../lib/store-catalog";
import ProductPage from "./product-client";
type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = /^-?\d+$/.test(id) ? await findProduct(Number(id)) : undefined;
  return {
    title: p ? `${p.name} | Brande` : "Product not found | Brande",
    description: p?.description,
  };
}
export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!/^-?\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const product = await findProduct(Number(id));
  if (!product) notFound();
  return <ProductPage product={product} />;
}

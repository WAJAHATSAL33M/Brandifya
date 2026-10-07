import type { Metadata } from "next";
import Shop from "./shop-client";
import "../homepage.css";
import "./shop.css";
export const metadata: Metadata = {
  title: "Shop | Brande",
  description: "Browse Brande products. Search by name and filter by category, price, color, and availability.",
};
export default function ShopPage() { return <Shop />; }

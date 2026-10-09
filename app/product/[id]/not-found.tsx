"use client";
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { useStore } from "../../use-store";
import { Breadcrumb, CommerceHeader } from "../../commerce-ui";
export default function ProductNotFound() {
  const store = useStore();
  return (
    <div className="hp commerce">
      <CommerceHeader store={store} />
      <main className="commerce-container">
        <Breadcrumb label="Product unavailable" />
        <section className="commerce-panel commerce-empty">
          <PackageSearch size={36} />
          <h1>Product not found</h1>
          <p>
            This product is no longer available, or its link has changed.
            Explore the shop to find your next favorite.
          </p>
          <Link className="commerce-primary" href="/shop">
            Explore the shop
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>
    </div>
  );
}

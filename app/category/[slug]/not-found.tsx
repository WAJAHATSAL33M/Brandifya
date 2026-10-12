"use client";
import Link from "next/link";
import { ArrowRight, Grid2X2 } from "lucide-react";
import { CommerceHeader, Breadcrumb } from "../../commerce-ui";
import { useStore } from "../../use-store";
export default function CategoryNotFound() {
  const store = useStore();
  return (
    <div className="hp commerce">
      <CommerceHeader store={store} />
      <main className="commerce-container">
        <Breadcrumb label="Category unavailable" />
        <section className="commerce-panel commerce-empty">
          <Grid2X2 size={36} />
          <h1>Collection not found</h1>
          <p>
            This collection is unavailable or its link has changed. Explore the
            shop to find something you love.
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

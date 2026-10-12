"use client";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { money, type Product } from "../lib/catalog";
export function ProductBadge({ label }: { label: string }) {
  const kind = /sold out|out of stock/i.test(label)
    ? "sold"
    : /star seller/i.test(label)
      ? "star"
      : "standard";
  return (
    <span className={`store-card-badge hp-badge badge-${kind}`}>
      {label}
      {kind === "star" && (
        <Star size={11} fill="currentColor" aria-hidden="true" />
      )}
    </span>
  );
}
export default function ProductCard({
  product: p,
  saved,
  onSave,
  live = false,
}: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  live?: boolean;
}) {
  const src = p.image.startsWith("/")
    ? p.image
    : `https://images.unsplash.com/${p.image}?auto=format&fit=crop&w=800&q=85`;
  const badge =
    p.id < 0
      ? "Design sample"
      : p.stock === 0
        ? "Sold Out"
        : p.badge && !p.badge.includes("%")
          ? p.badge
          : null;
  const rating =
    typeof p.rating === "number" &&
    Number.isFinite(p.rating) &&
    p.rating >= 0 &&
    p.rating <= 5 &&
    Number.isSafeInteger(p.reviewCount) &&
    p.reviewCount! > 0;
  const sold = Number.isSafeInteger(p.soldCount) && p.soldCount! > 0;
  return (
    <article
      className="store-product-card hp-featured-card"
      data-category={p.category}
      data-product-id={p.id}
    >
      <Link
        className="store-card-image hp-featured-image"
        href={`/product/${p.id}`}
        aria-label={`View ${p.name}`}
      >
        <img src={src} alt={p.name} loading="lazy" width={600} height={450} />
      </Link>
      {badge && <ProductBadge label={badge} />}
      <button
        className="store-card-heart hp-heart"
        type="button"
        aria-label={`${saved ? "Remove" : "Save"} ${p.name}${saved ? " from wishlist" : " to wishlist"}`}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="store-card-body hp-featured-body">
        <Link
          className="store-card-name hp-featured-name"
          href={`/product/${p.id}`}
        >
          {p.name}
        </Link>
        <span className="store-card-category shop-card-category">
          {p.category}
        </span>
        {(rating || sold || (live && p.stock > 0 && p.stock <= 3)) ? (
          <div className="store-card-stats">
            {rating && (
              <span
                className="store-card-rating"
                role="img"
                title={live ? undefined : "Demo rating and sales figures"}
                aria-label={`${live ? "" : "Demo: "}${p.rating} out of 5 from ${p.reviewCount} reviews`}
              >
                <span className="store-card-stars" aria-hidden="true">
                  ★★★★★
                  <span style={{ width: `${(p.rating! / 5) * 100}%` }}>
                    ★★★★★
                  </span>
                </span>
                {p.rating!.toFixed(1)}
              </span>
            )}
            {sold ? (
              <small>
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(p.soldCount!)}{" "}
                sold
              </small>
            ) : live && p.stock > 0 && p.stock <= 3 ? (
              <small className="store-card-low">Few left</small>
            ) : null}
          </div>
        ) : <div className="store-card-stats store-card-stats-empty" aria-hidden="true" />}
        <strong className="store-card-price">
          {money(p.price)}
        </strong>
      </div>
    </article>
  );
}

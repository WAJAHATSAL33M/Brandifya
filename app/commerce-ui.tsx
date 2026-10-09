"use client";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  LockKeyhole,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { money, subtotal, type Product } from "../lib/catalog";
import type { Store } from "./use-store";
import StoreHeader from "./store-header";
export const productImage = (src: string) =>
  src.startsWith("/")
    ? src
    : `https://images.unsplash.com/${src}?auto=format&fit=crop&w=1000&q=85`;
export function CommerceHeader({ store }: { store: Store }) {
  return (
    <StoreHeader
      active="shop"
      wishlistCount={store.saved.length}
      bagCount={store.count}
      onWishlist={() => location.assign("/shop?saved=1")}
      onBag={() => location.assign("/cart")}
    />
  );
}
export function Breadcrumb({ label }: { label: string }) {
  return (
    <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <ChevronRight size={13} />
      <Link href="/shop">Shop</Link>
      <ChevronRight size={13} />
      <span aria-current="page">{label}</span>
    </nav>
  );
}
export function Steps({ active }: { active: number }) {
  return (
    <nav className="commerce-steps" aria-label="Checkout progress">
      {["Cart", "Delivery", "Payment", "Confirmation"].map((label, i) => (
        <span key={label} aria-current={i + 1 === active ? "step" : undefined}>
          <b>{i + 1}</b>
          {i === 0 ? <Link href="/cart">{label}</Link> : label}
        </span>
      ))}
    </nav>
  );
}
export function Quantity({
  value,
  max,
  onChange,
  name,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  name: string;
}) {
  return (
    <div className="commerce-quantity">
      <button
        type="button"
        aria-label={`Decrease ${name} quantity`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={15} />
      </button>
      <span aria-label={`${name} quantity`}>{value}</span>
      <button
        type="button"
        aria-label={`Increase ${name} quantity`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
export function ProductCards({
  items,
  store,
  title = "You may also like",
}: {
  items: Product[];
  store: Store;
  title?: string;
}) {
  return items.length ? (
    <section className="commerce-recommendations">
      <div className="commerce-section-heading">
        <h2>{title}</h2>
        <Link href="/shop">
          View all
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="commerce-product-grid">
        {items.slice(0, 3).map((p) => (
          <article className="commerce-product-card" key={p.id}>
            <Link href={`/product/${p.id}`}>
              <img
                src={productImage(p.image)}
                alt={p.name}
                loading="lazy"
                width={300}
                height={300}
              />
            </Link>
            {p.badge && !p.badge.includes("%") && (
              <span className="commerce-product-badge">{p.badge}</span>
            )}
            <button
              className="commerce-favorite"
              aria-label={`${store.saved.includes(p.id) ? "Remove" : "Save"} ${p.name}${store.saved.includes(p.id) ? " from wishlist" : " to wishlist"}`}
              aria-pressed={store.saved.includes(p.id)}
              onClick={() => store.favorite(p.id)}
            >
              <Heart
                size={17}
                fill={store.saved.includes(p.id) ? "currentColor" : "none"}
              />
            </button>
            <div>
              <Link href={`/product/${p.id}`}>{p.name}</Link>
              <small>{p.category}</small>
              <strong>{money(p.price)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  ) : null;
}
export function BagItems({
  store,
  compact = false,
}: {
  store: Store;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "commerce-bag-items compact" : "commerce-bag-items"}
    >
      {store.cart.map((i) => {
        const p = store.catalog.find((p) => p.id === i.id);
        return p ? (
          <article className="commerce-bag-item" key={p.id}>
            <Link className="commerce-item-photo" href={`/product/${p.id}`}>
              <img
                src={productImage(p.image)}
                alt={p.name}
                width={120}
                height={120}
              />
            </Link>
            <div className="commerce-item-info">
              <Link href={`/product/${p.id}`} className="commerce-item-name">
                {p.name}
              </Link>
              <small>{p.color ? `Color: ${p.color}` : p.category}</small>
              {!compact && (
                <>
                  <span className="commerce-item-stock">
                    {store.config?.live ? "In stock" : "Sample availability"}
                  </span>
                  <button
                    className="commerce-save-later"
                    type="button"
                    onClick={() => store.favorite(p.id)}
                    aria-pressed={store.saved.includes(p.id)}
                  >
                    <Heart
                      size={15}
                      fill={
                        store.saved.includes(p.id) ? "currentColor" : "none"
                      }
                    />
                    {store.saved.includes(p.id)
                      ? "Saved for later"
                      : "Save for later"}
                  </button>
                </>
              )}
            </div>
            {!compact && (
              <div className="commerce-unit-price">
                <small>Price</small>
                <strong>{money(p.price)}</strong>
              </div>
            )}
            <div className="commerce-item-quantity">
              {!compact && <small>Quantity</small>}
              <Quantity
                value={i.quantity}
                max={Math.min(p.stock, 99)}
                name={p.name}
                onChange={(value) => store.quantity(p.id, value)}
              />
            </div>
            <div className="commerce-item-subtotal">
              {!compact && <small>Subtotal</small>}
              <strong>{money(p.price * i.quantity)}</strong>
            </div>
            <button
              className="commerce-remove"
              type="button"
              aria-label={`Remove ${p.name} from bag`}
              onClick={() => store.quantity(p.id, 0)}
            >
              <Trash2 size={17} />
            </button>
          </article>
        ) : null;
      })}
    </div>
  );
}
export function Totals({ store }: { store: Store }) {
  const sum = subtotal(store.cart, store.catalog),
    shipping = store.config?.live ? store.config.shippingMinor / 100 : 0;
  return (
    <div className="commerce-totals">
      <div>
        <span>
          Subtotal ({store.count} {store.count === 1 ? "item" : "items"})
        </span>
        <strong>{money(sum)}</strong>
      </div>
      <div>
        <span>Shipping</span>
        <strong>{store.config?.live ? money(shipping) : "At checkout"}</strong>
      </div>
      <div className="commerce-total">
        <span>{store.config?.live ? "Total" : "Estimated total"}</span>
        <strong>{money(sum + shipping)}</strong>
      </div>
      <p>
        {store.config?.live
          ? "Prices and availability are checked when you place your order."
          : "Sample prices. Ordering is not available yet."}
      </p>
    </div>
  );
}
export function EmptyBag() {
  return (
    <section className="commerce-panel commerce-empty">
      <ShoppingBag size={36} />
      <h2>Your next favorite awaits.</h2>
      <p>
        Your shopping bag is empty. Explore the collection and add something you
        love.
      </p>
      <Link className="commerce-primary" href="/shop">
        Explore the shop
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
export function StoreStatus({ store }: { store: Store }) {
  return (
    <>
      {store.notice && (
        <p className="commerce-notice" role="status">
          {store.notice}
        </p>
      )}
      {store.error && (
        <div className="commerce-panel commerce-error" role="alert">
          <p>{store.error}</p>
          <button type="button" onClick={store.load}>
            Try again
          </button>
        </div>
      )}
    </>
  );
}
export function CheckoutNote() {
  return (
    <p className="commerce-checkout-note">
      <LockKeyhole size={14} />
      Card payment is handled by Stripe.
    </p>
  );
}

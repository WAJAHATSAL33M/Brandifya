"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categoryHref } from "../../../lib/categories";
import { ArrowRight, Heart, Maximize2, ShoppingBag, X } from "lucide-react";
import { money, type Product } from "../../../lib/catalog";
import { useStore } from "../../use-store";
import {
  Breadcrumb,
  CommerceHeader,
  ProductCards,
  Quantity,
  StoreStatus,
  productImage,
} from "../../commerce-ui";
export default function ProductPage({ product }: { product: Product }) {
  const store = useStore(),
    [amount, setAmount] = useState(1),
    [zoom, setZoom] = useState(false),
    [added, setAdded] = useState(false);
  const close = useRef<HTMLButtonElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const current = store.catalog.find((p) => p.id === product.id),
    p = current || product;
  const max = current
    ? Math.max(
        0,
        Math.min(current.stock, 99) -
          (store.cart.find((i) => i.id === p.id)?.quantity || 0),
      )
    : 0;
  useEffect(() => {
    setAmount((current) => Math.max(1, Math.min(current, max)));
  }, [max]);
  useEffect(() => {
    if (!zoom) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "Tab") {
        e.preventDefault();
        close.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      trigger.current?.focus();
    };
  }, [zoom]);
  return (
    <div className="hp commerce">
      <CommerceHeader store={store} />
      <main className="commerce-container">
        <Breadcrumb label={p.name} />
        <StoreStatus store={store} />
        <section className="commerce-product-detail">
          <div className="commerce-product-visual">
            <img
              src={productImage(p.image)}
              alt={p.name}
              width={900}
              height={900}
              fetchPriority="high"
            />
            <button
              ref={trigger}
              className="commerce-zoom"
              aria-label={`Enlarge ${p.name} image`}
              onClick={() => setZoom(true)}
            >
              <Maximize2 size={20} />
            </button>
            {p.badge && !p.badge.includes("%") && (
              <span className="commerce-product-badge">{p.badge}</span>
            )}
          </div>
          <div className="commerce-product-copy">
            <Link
              className="commerce-product-category"
              href={categoryHref(p.category)}
            >
              {p.category}
              <ArrowRight size={14} />
            </Link>
            <h1>{p.name}</h1>
            <strong className="commerce-product-price">
              {p.id < 0 ? "Price to be confirmed" : money(p.price)}
            </strong>
            <p className="commerce-availability">
              {store.loading
                ? "Checking availability…"
                : !current || p.stock < 1
                  ? "Currently unavailable"
                  : store.config?.live
                    ? "In stock"
                    : "Sample product"}
            </p>
            <dl className="commerce-product-facts">
              {p.color && (
                <div>
                  <dt>Color</dt>
                  <dd>{p.color}</dd>
                </div>
              )}
              <div>
                <dt>Product reference</dt>
                <dd>{p.id < 0 ? `Sample ${Math.abs(p.id)}` : `BRD-${p.id}`}</dd>
              </div>
            </dl>
            <div className="commerce-product-purchase">
              <Quantity
                value={amount}
                max={max}
                onChange={setAmount}
                name={p.name}
              />
              <button
                className="commerce-primary"
                disabled={store.loading || !!store.error || max < 1 || p.id < 1}
                onClick={() => {
                  if (store.add(p, amount)) setAdded(true);
                }}
              >
                <ShoppingBag size={17} />
                {max < 1 ? "Unavailable" : "Add to Bag"}
              </button>
            </div>
            <button
              className="commerce-product-save"
              aria-pressed={store.saved.includes(p.id)}
              onClick={() => store.favorite(p.id)}
            >
              <Heart
                size={18}
                fill={store.saved.includes(p.id) ? "currentColor" : "none"}
              />
              {store.saved.includes(p.id)
                ? "Saved to your wishlist"
                : "Save to your wishlist"}
            </button>
            {added && (
              <div className="commerce-added" role="status">
                Added to your bag.
                <Link href="/cart">
                  View bag
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
            <details open>
              <summary>Product details</summary>
              <p>{p.description}</p>
            </details>
            <details>
              <summary>Delivery &amp; payment</summary>
              <p>
                {store.config?.live
                  ? `Shipping is ${money(store.config.shippingMinor / 100)} per order. Delivery details are reviewed at checkout.`
                  : "Explore this sample and save it for later. Live ordering will be available after store setup is complete."}
              </p>
            </details>
            <details>
              <summary>Need help choosing?</summary>
              <p>
                Have a question about this product?{" "}
                <Link href="/#contact">Contact Brande</Link> before placing your
                order.
              </p>
            </details>
          </div>
        </section>
        <ProductCards
          items={store.catalog
            .filter((item) => item.id !== p.id && item.category === p.category)
            .concat(
              store.catalog.filter(
                (item) => item.id !== p.id && item.category !== p.category,
              ),
            )}
          store={store}
        />
      </main>
      {zoom && (
        <div
          className="commerce-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${p.name} image`}
          onClick={(e) => {
            if (e.currentTarget === e.target) setZoom(false);
          }}
        >
          <button
            ref={close}
            aria-label="Close enlarged image"
            onClick={() => setZoom(false)}
          >
            <X />
          </button>
          <img src={productImage(p.image)} alt={p.name} />
        </div>
      )}
    </div>
  );
}

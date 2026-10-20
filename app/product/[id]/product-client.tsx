"use client";
import { useEffect, useRef, useState } from "react";
import ProductPrice from "../../product-price";
import Link from "next/link";
import { useMerchandising } from "../../use-merchandising";
import { ProductBadge } from "../../product-card";
import { categoryHref } from "../../../lib/categories";
import { ArrowRight, Maximize2, ShoppingCart, X, Timer, Zap, Package, Truck, ShieldCheck, Headphones, ChevronDown, ChevronRight } from "lucide-react";
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
    [galleryImage, setGalleryImage] = useState(""),
    [added, setAdded] = useState(false),
    [offerSeconds, setOfferSeconds] = useState(0);
  const close = useRef<HTMLButtonElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const current = store.catalog.find((p) => p.id === product.id),
    p = current || product;
  const { badge, lowStock, promotion } = useMerchandising(
    p,
    !!store.config?.live,
  );
  useEffect(() => {
    if (!promotion || !p.promotionEndsAt) { setOfferSeconds(0); return; }
    const end = Date.parse(p.promotionEndsAt);
    const tick = () => setOfferSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [promotion, p.promotionEndsAt]);
  const offerTime = [
    offerSeconds >= 86400 ? `${Math.floor(offerSeconds / 86400)}d` : '',
    `${String(Math.floor(offerSeconds / 3600) % 24).padStart(2, '0')}h`,
    `${String(Math.floor(offerSeconds / 60) % 60).padStart(2, '0')}m`,
    `${String(offerSeconds % 60).padStart(2, '0')}s`,
  ].filter(Boolean).join(' ');
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
              src={productImage(galleryImage || p.image)}
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
            {badge && <ProductBadge label={badge} />}
            {!!p.media?.length && (
              <div className="product-media-gallery">
                <button
                  type="button"
                  className="product-gallery-image"
                  onClick={() => setGalleryImage("")}
                  aria-label="Show main product image"
                >
                  <img
                    src={productImage(p.image)}
                    alt=""
                    width={100}
                    height={100}
                  />
                </button>
                {p.media.map((media, i) =>
                  media.type === "image" ? (
                    <button
                      type="button"
                      className="product-gallery-image"
                      key={i}
                      onClick={() => setGalleryImage(media.url)}
                      aria-label={media.alt || `Show product image ${i + 1}`}
                    >
                      <img
                        src={media.url}
                        alt=""
                        width={100}
                        height={100}
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <video
                      key={i}
                      src={media.url}
                      controls
                      preload="metadata"
                      aria-label={media.alt || "Product video"}
                    />
                  ),
                )}
              </div>
            )}
          </div>
          <div className="commerce-product-copy product-reference-copy">
            <Link
              className="commerce-product-category"
              href={categoryHref(p.category)}
            >
              {p.category}
              <ArrowRight size={14} />
            </Link>
            <h1>{p.name}</h1>
            <ProductPrice
              className="commerce-product-price"
              price={p.price}
              originalPrice={p.originalPrice}
            />
            {lowStock && (
              <p className="product-stock-status">
                Only {p.stock} left in stock
              </p>
            )}
            {promotion && offerSeconds > 0 && (
              <div className="product-offer-countdown" role="timer" aria-live="off">
                <Timer aria-hidden="true" />
                <span>Offer ends in <strong>{offerTime}</strong></span>
                <ChevronRight aria-hidden="true" />
              </div>
            )}
            {(store.loading || !current || p.stock < 1 || store.config?.live) && (
              <p className="commerce-availability">
                {store.loading
                  ? "Checking availability…"
                  : !current || p.stock < 1
                    ? "Currently unavailable"
                    : "In stock"}
              </p>
            )}
            <div className="commerce-product-purchase">
              <Quantity
                value={amount}
                max={max}
                onChange={setAmount}
                name={p.name}
              />
              <button
                className="commerce-product-cart"
                disabled={store.loading || !!store.error || max < 1 || p.id < 1}
                onClick={() => {
                  if (store.add(p, amount)) setAdded(true);
                }}
              >
                <ShoppingCart size={20} aria-hidden="true" />
                <span>Add to Cart</span>
              </button>
              <button
                className="commerce-primary"
                disabled={store.loading || !!store.error || max < 1 || p.id < 1}
                onClick={() => {
                  if (store.add(p, amount)) window.location.assign("/cart");
                }}
              >
                <Zap size={20} fill="currentColor" aria-hidden="true" />
                <span>Buy Now</span>
              </button>
            </div>
            {added && (
              <div className="commerce-added" role="status">
                Added to your cart.
                <Link href="/cart">
                  Go to Cart
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
            <div className="product-info-panels">
              <details className="product-info-panel product-info-description">
                <summary>
                  <span className="product-info-icon"><Package aria-hidden="true" /></span>
                  <span className="product-info-summary"><strong>Product Details</strong><span>{p.description}</span></span>
                  <ChevronDown className="product-info-chevron" aria-hidden="true" />
                </summary>
                <div className="product-info-content">
                  {!!Object.keys(p.attributes || {}).length ? <dl className="commerce-product-facts">
                    {Object.entries(p.attributes || {}).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                  </dl> : <p>Review the product images and description, or <Link href="/contact">ask our team</Link> for more information before ordering.</p>}
                </div>
              </details>
              <details className="product-info-panel product-info-delivery">
                <summary>
                  <span className="product-info-icon"><Truck aria-hidden="true" /></span>
                  <span className="product-info-summary"><strong>Delivery &amp; Payment</strong><span>Shipping options, delivery time and available payment methods.</span></span>
                  <ChevronDown className="product-info-chevron" aria-hidden="true" />
                </summary>
                <div className="product-info-content"><p>{store.config?.live
                  ? `Shipping is ${money(store.config.shippingMinor / 100)} per order. Confirm your delivery address and available payment method at checkout.`
                  : "Live ordering will be available after store setup is complete. Contact our team to confirm delivery options and payment methods."}</p></div>
              </details>
              <details className="product-info-panel product-info-returns">
                <summary>
                  <span className="product-info-icon"><ShieldCheck aria-hidden="true" /></span>
                  <span className="product-info-summary"><strong>Warranty &amp; Returns</strong><span>Return policy and warranty information.</span></span>
                  <ChevronDown className="product-info-chevron" aria-hidden="true" />
                </summary>
                <div className="product-info-content"><p>Read our <Link href="/returns">return and refund policy</Link> for eligibility and the return process. Warranty coverage varies by product; <Link href="/contact">contact our team</Link> to confirm coverage before purchasing.</p></div>
              </details>
              <details className="product-info-panel product-info-help">
                <summary>
                  <span className="product-info-icon"><Headphones aria-hidden="true" /></span>
                  <span className="product-info-summary"><strong>Need Help Choosing?</strong><span>Get help from our team.</span></span>
                  <ChevronDown className="product-info-chevron" aria-hidden="true" />
                </summary>
                <div className="product-info-content"><p>Have a question about this product? <Link href="/contact">Contact Brand E</Link> before placing your order.</p></div>
              </details>
            </div>
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
          <img src={productImage(galleryImage || p.image)} alt={p.name} />
        </div>
      )}
    </div>
  );
}

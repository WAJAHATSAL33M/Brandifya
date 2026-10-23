"use client";
import { storeContactMessage } from "../lib/store-contact";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  ShoppingBag,
  Heart,
  X,
  Plus,
  Minus,
  Menu,
  SlidersHorizontal,
  Package,
  Truck,
  ShieldCheck,
  Check,
  ChevronDown,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Flame,
} from "lucide-react";
import {
  products,
  categories,
  money,
  sanitizeCart,
  subtotal,
  type Product,
  type CartItem,
} from "../lib/catalog";
import "./homepage.css";
import { categoryHref } from "../lib/categories";
import ProductCard from "./product-card";
import { referenceProducts } from "../lib/reference-catalog";
import HeroSlider from "./hero-slider";
import PromoBanner from "./promo-banner";
import BlogSlider from "./blog-slider";
import SwipeLoop from "./swipe-loop";
import SaleProducts from "./sale-products";
import StoreHeader from "./store-header";
import art from "../lib/home-art.json";
import {
  categoryTiles,
  dealProducts,
  bestProducts,
  journalPosts as initialJournalPosts,
  type ReferenceProduct,
} from "../lib/home-content";
function Art({
  name,
  alt,
  eager = false,
}: {
  name: string;
  alt: string;
  eager?: boolean;
}) {
  const a = art.assets[name as keyof typeof art.assets];
  return (
    <span className="hp-art" style={{ aspectRatio: `${a.w}/${a.h}` }}>
      <img
        src="/homepage-design.webp"
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        style={{
          width: `${(art.width / a.w) * 100}%`,
          left: 0,
          top: 0,
          transform: `translate(${(-a.x / art.width) * 100}%, ${(-a.y / art.height) * 100}%)`,
        }}
      />
    </span>
  );
}
function ReferenceCard({
  product: p,
  artwork,
  deal = false,
  onView,
  onSave,
  saved,
}: {
  product: ReferenceProduct;
  artwork: string;
  deal?: boolean;
  onView: () => void;
  onSave: () => void;
  saved: boolean;
}) {
  const id = artwork.startsWith("deal")
    ? -1 - Number(artwork.slice(4))
    : -7 - Number(artwork.slice(4));
  const product = referenceProducts.find((item) => item.id === id)!;
  return <ProductCard product={product} saved={saved} onSave={onSave} />;
}

const photo = (id: string, w = 800) =>
  id.startsWith("/") || id.startsWith("https://")
    ? id
    : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export default function Store() {
  const [journalPosts,setJournalPosts]=useState<typeof initialJournalPosts>([]);
  useEffect(()=>{let active=true;fetch('/api/journal').then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(active)setJournalPosts(d.posts)}).catch(()=>{if(active)setJournalPosts([])});return()=>{active=false}},[]);
  const [catalog, setCatalog] = useState<Product[]>(products),
    [live, setLive] = useState(false),
    [managed, setManaged] = useState(false);
  const [category, setCategory] = useState("All finds"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("featured"),
    [cart, setCart] = useState<CartItem[]>([]),
    [saved, setSaved] = useState<number[]>([]),
    [ready, setReady] = useState(false),
    [drawer, setDrawer] = useState(false),
    [selected, setSelected] = useState<Product | null>(null),
    [savedOnly, setSavedOnly] = useState(false),
    [notice, setNotice] = useState(""),
    [addedId, setAddedId] = useState<number | null>(null),
    [info, setInfo] = useState<string | null>(null),
    [catalogError, setCatalogError] = useState(false);
  const [brandPage, setBrandPage] = useState(0);
  const exploreRef = useRef<HTMLDivElement>(null);
  const exploreResumeAt = useRef(0);
  const exploreInteracting = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const brandNames = [
    "Apple",
    "Samsung",
    "Nike",
    "Adidas",
    "Sony",
    "Canon",
    "Lenovo",
    "Philips",
  ];
  const requestedBrand = info && brandNames.includes(info) ? info : null;
  function pauseExplore() {
    exploreResumeAt.current = Date.now() + 6000;
  }
  function slideBest(direction: number) {
    pauseExplore();
    const rail = exploreRef.current;
    if (!rail) return;
    const card = rail.firstElementChild as HTMLElement | null;
    const step = (card?.getBoundingClientRect().width || 250) + parseFloat(getComputedStyle(rail).columnGap || "0");
    rail.scrollBy({ left: direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      const rail = exploreRef.current;
      if (!rail || motion.matches || document.hidden || exploreInteracting.current || Date.now() < exploreResumeAt.current ||
          rail.contains(document.activeElement) ||
          (window.matchMedia("(hover: hover)").matches && rail.matches(":hover"))) return;
      const max = rail.scrollWidth - rail.clientWidth;
      if (max < 2) return;
      const card = rail.firstElementChild as HTMLElement | null;
      const step = (card?.getBoundingClientRect().width || 250) + parseFloat(getComputedStyle(rail).columnGap || "0");
      rail.scrollTo({ left: rail.scrollLeft >= max - 2 ? 0 : Math.min(max, rail.scrollLeft + step), behavior: "smooth" });
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);
  function slideBrands(direction: number) {
    if (window.innerWidth > 900)
      setBrandPage((page) => (page + direction + 8) % 8);
    else
      document
        .getElementById("brand-list")
        ?.scrollBy({ left: direction * 200, behavior: "smooth" });
  }
  function openReference(p: ReferenceProduct) {
    const index = dealProducts.includes(p)
      ? dealProducts.indexOf(p)
      : 6 + bestProducts.indexOf(p);
    window.location.assign(`/product/${-1 - index}`);
  }
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const modalOpen = drawer || !!selected || !!info;
  useEffect(() => {
    try {
      setCart(
        sanitizeCart(
          JSON.parse(localStorage.getItem("brandifya-cart") || "[]"),
        ),
      );
      const s = JSON.parse(localStorage.getItem("brandifya-saved") || "[]");
      setSaved(
        Array.isArray(s)
          ? s.filter(
              (id: unknown) =>
                typeof id === "number" &&
                Number.isSafeInteger(id) &&
                (id > 0 || (id >= -12 && id < 0)),
            )
          : [],
      );
    } catch {}
    fetch("/api/catalog")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setCatalog(data.products);
        setLive(data.live);
        setManaged(data.managed === true);
        try {
          setCart(
            sanitizeCart(
              JSON.parse(localStorage.getItem("brandifya-cart") || "[]"),
              data.products,
            ),
          );
        } catch {}
      })
      .catch(() => {
        setCatalog([]);
        setCart([]);
        setCatalogError(true);
        setNotice(
          "Inventory could not be loaded. Please refresh before shopping.",
        );
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("brandifya-cart", JSON.stringify(cart));
        localStorage.setItem("brandifya-saved", JSON.stringify(saved));
      } catch {}
    }
  }, [cart, saved, ready]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => {
      setNotice("");
      setAddedId(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!modalOpen) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawer(false);
        setSelected(null);
        setInfo(null);
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[role="dialog"] button,[role="dialog"] a,[role="dialog"] input',
          ),
        ).filter((n) => !n.hasAttribute("disabled"));
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", key);
      lastFocus.current?.focus();
    };
  }, [modalOpen]);
  const visible = useMemo(
    () =>
      catalog
        .filter(
          (p) =>
            (category === "All finds" || p.category === category) &&
            (!savedOnly || saved.includes(p.id)) &&
            (p.name + " " + p.category)
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "high"
              ? b.price - a.price
              : sort === "name"
                ? a.name.localeCompare(b.name)
                : a.id - b.id,
        ),
    [category, query, sort, savedOnly, saved, catalog],
  );
  const count = cart.reduce((n, c) => n + c.quantity, 0),
    total = subtotal(cart, catalog);
  function add(p: Product) {
    const current = cart.find((c) => c.id === p.id);
    if ((current?.quantity || 0) >= p.stock) {
      setNotice("Maximum available quantity reached");
      return;
    }
    setCart((c) => {
      const item = c.find((i) => i.id === p.id);
      return item
        ? c.map((i) =>
            i.id === p.id
              ? { ...i, quantity: Math.min(i.quantity + 1, p.stock) }
              : i,
          )
        : p.stock > 0
          ? [...c, { id: p.id, quantity: 1 }]
          : c;
    });
    setAddedId(p.id);
    setNotice(`${p.name} added to your cart`);
  }
  function favorite(id: number) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function browse(c = "All finds") {
    window.location.assign(c === "All finds" ? "/shop" : categoryHref(c));
  }
  const policies: Record<string, string> = {
    ...Object.fromEntries(
      [...dealProducts, ...bestProducts].map((p) => [
        p.name,
        `${p.description} This product is shown as part of the supplied homepage design. Catalog availability is not configured yet.`,
      ]),
    ),
    ...Object.fromEntries(
      journalPosts.map((p) => [
        p.title,
        "A preview article from the homepage design. The complete journal content will be added here.",
      ]),
    ),
    "Track Order":
      "Your order reference is available on the order confirmation page. Customer order tracking is being configured.",
    "Size Guide":
      "Product-specific measurements and fit guidance will be supplied with the final catalog.",
    "Gift Cards": "Gift cards are not currently available.",
    "Social profiles": "The store’s social profiles will be connected here.",

    "A calmer home, one corner at a time":
      "Start with a single corner: a comfortable seat, a useful light, and a place for the things you reach for daily. Choose textures and colors you enjoy, leave room to move, and add objects slowly as you discover what your space needs.",
    "The everyday bag checklist":
      "Choose a bag around what you actually carry. Measure your laptop, consider how long you wear it, and look for pockets that suit your routine. A practical shape and a comfortable fit are more useful than extra compartments you rarely use.",
    "Make room for a simpler routine":
      "Keep your daily essentials easy to find and review what you use regularly. Store products according to their labels and check care instructions before buying. Start with a small, consistent routine that fits your time and preferences.",
    "About Brandifya":
      "Brandifya is a general-store concept bringing home, style, tech, and everyday essentials together. This storefront currently uses sample products and prices.",
    "Shipping & returns":
      "Delivery areas, shipping fees, timelines, and return terms will be published once the merchant confirms them. Products cannot currently be ordered.",
    "Contact us": storeContactMessage,
    Privacy:
      "Your cart and saved items are stored in this browser. When live checkout is enabled, delivery details are stored in the merchant database and card details are handled by Stripe. Newsletter signup stores your email with your consent. The merchant must publish a complete privacy policy and data retention terms before launch.",
    Checkout:
      "Checkout is not yet available. This is a sample catalog: no order has been placed and no payment has been collected. Live checkout requires verified products, shipping rules, and a payment provider.",
  };
  return (
    <>
      <a className="skip" href="#shop">
        Skip to products
      </a>
      <div className="hp">
        <StoreHeader
          active="home"
          wishlistCount={saved.length}
          bagCount={count}
          wishlistActive={savedOnly}
          onWishlist={() => {
            setCategory("All finds");
            setQuery("");
            setSavedOnly(true);
            document
              .getElementById("shop")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          onBag={() => window.location.assign("/cart")}
        />

        <main>
          <HeroSlider />
          <section className="hp-categories hp-container" aria-label="Shop by Category">
            <SwipeLoop className="category-carousel-viewport" label="Shop by Category">
              <div className="category-carousel-track">
                {[0, 1].map((copy) => (
                  <div
                    key={copy}
                    className={`hp-category-grid${copy ? " category-carousel-copy" : ""}`}
                    aria-hidden={copy ? true : undefined}
                  >
                    {categoryTiles.map((c) => (
                      <button
                        key={c.name}
                        className="hp-category"
                        tabIndex={copy ? -1 : undefined}
                        onClick={() => browse(c.category)}
                      >
                        <img
                          className="compact-category-image"
                          src={c.image}
                          alt=""
                          width={300}
                          height={300}
                        />
                        <span>
                          {c.name}
                          <i>
                            <ArrowRight size={16} />
                          </i>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </SwipeLoop>
          </section>
          <SaleProducts catalog={catalog} saved={saved} onSave={favorite} live={live} />
          <section id="shop" className="hp-featured hp-container">
            <h2>
              {savedOnly
                ? "Favorites"
                : category === "All finds"
                  ? "Featured Products"
                  : category}
            </h2>
            {(searchOpen || query || category !== "All finds" || savedOnly) && (
              <div className="hp-search">
                <label>
                  <Search size={17} />
                  <input
                    id="search"
                    aria-label="Search products"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setQuery("");
                    setCategory("All finds");
                    setSavedOnly(false);
                  }}
                  aria-label="Clear filters"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            {catalogError && (
              <p role="alert">Products could not be loaded. Please refresh.</p>
            )}
            <SwipeLoop className="featured-carousel-viewport" label="Featured Products" advance="card">
              <div className="featured-carousel-track">
                {(visible.length > 2 ? [0, 1] : [0]).map((copy) => (
                  <div key={copy} className={`hp-featured-grid${copy ? " featured-carousel-copy" : ""}`} aria-hidden={copy ? true : undefined}>
                    {visible.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        saved={saved.includes(p.id)}
                        onSave={() => favorite(p.id)}
                        live={live}
                        tabIndex={copy ? -1 : undefined}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </SwipeLoop>
            {savedOnly && (
              <div className="hp-featured-grid hp-reference-wishlist">
                {[...dealProducts, ...bestProducts].map(
                  (p, i) =>
                    saved.includes(-1 - i) && (
                      <ReferenceCard
                        key={p.name}
                        product={p}
                        artwork={i < 6 ? `deal${i}` : `best${i - 6}`}
                        saved
                        onView={() => openReference(p)}
                        onSave={() => favorite(-1 - i)}
                      />
                    ),
                )}
              </div>
            )}
            {!visible.length &&
              !(savedOnly && saved.some((id) => id < 0)) &&
              !catalogError && (
                <div className="empty">
                  <Search size={30} />
                  <h3>No products found</h3>
                  <button
                    className="primary store-view-all"
                    onClick={() => {
                      setQuery("");
                      browse();
                    }}
                  >
                    View all products
                  </button>
                </div>
              )}
          </section>
          <section id="deals" className="hp-deals">
            <div className="hp-container">
              <div className="hp-deal-heading">
                <h2>Everyday Finds</h2>
                <button className="compact-view-all store-view-all" onClick={() => browse()}>
                  View all
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="hp-six-grid">
                {live || managed
                  ? catalog
                      .slice(0, 6)
                      .map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          saved={saved.includes(p.id)}
                          onSave={() => favorite(p.id)}
                          live={live}
                        />
                      ))
                  : dealProducts.map((p, i) => (
                      <ReferenceCard
                        key={p.name}
                        product={p}
                        artwork={`deal${i}`}
                        deal
                        onView={() => openReference(p)}
                        onSave={() => favorite(-1 - dealProducts.indexOf(p))}
                        saved={saved.includes(-1 - dealProducts.indexOf(p))}
                      />
                    ))}
              </div>
            </div>
          </section>
          <section className="hp-promotions hp-container">
            <h2>Style, Care &amp; Tech for a <span className="promo-heading-highlight">Brighter You</span></h2>
            <div className="hp-promo-grid compact-promos">
              {[
                { name: "Fashion", description: "Everyday style, thoughtfully chosen.", images: ["/heroes/fashion.webp", "/promotions/fashion-2.webp", "/promotions/fashion-3.webp"] },
                { name: "Beauty", description: "A little care for your daily routine.", images: ["/heroes/shop-beauty.webp", "/promotions/beauty-2.webp", "/promotions/beauty-3.webp"] },
                { name: "Technology", description: "Smart essentials for everyday life.", images: ["/heroes/home-tech.webp", "/promotions/tech-2.webp", "/promotions/tech-3.webp"] },
              ].map(c => <PromoBanner key={c.name} name={c.name} images={c.images} description={c.description} />)}
            </div>
          </section>
          <section className="hp-best hp-pattern">
            <div className="hp-container">
              <div className="hp-centered-heading">
                <h2>
                  More to <em>Explore</em>
                </h2>
                <p>Discover more everyday finds across the collection.</p>
                <button className="hp-view-all store-view-all" onClick={() => browse()}>
                  View All Products <ArrowRight size={16} />
                </button>
              </div>
              <div className="hp-carousel">
                <button
                  className="hp-carousel-arrow hp-arrow-left"
                  aria-label="Previous products in More to Explore"
                  onClick={() => slideBest(-1)}
                >
                  <ChevronLeft />
                </button>
                <div
                  className="hp-six-grid hp-scroll explore-product-rail"
                  id="best-products"
                  ref={exploreRef}
                  role="region"
                  aria-roledescription="carousel"
                  aria-label="More to Explore products"
                  onPointerDown={() => { exploreInteracting.current = true; pauseExplore(); }}
                  onPointerUp={() => { exploreInteracting.current = false; pauseExplore(); }}
                  onPointerCancel={() => { exploreInteracting.current = false; pauseExplore(); }}
                  onPointerLeave={() => { exploreInteracting.current = false; pauseExplore(); }}
                  onTouchStart={pauseExplore}
                  onTouchEnd={pauseExplore}
                  onWheel={pauseExplore}
                >
                  {live || managed
                    ? catalog
                        .slice(0, 6)
                        .map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            saved={saved.includes(p.id)}
                            onSave={() => favorite(p.id)}
                            live={live}
                          />
                        ))
                    : bestProducts.map((p) => (
                        <ReferenceCard
                          key={p.name}
                          product={p}
                          artwork={`best${bestProducts.indexOf(p)}`}
                          onView={() => openReference(p)}
                          onSave={() => favorite(-7 - bestProducts.indexOf(p))}
                          saved={saved.includes(-7 - bestProducts.indexOf(p))}
                        />
                      ))}
                </div>
                <button
                  className="hp-carousel-arrow hp-arrow-right"
                  aria-label="Next products in More to Explore"
                  onClick={() => slideBest(1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </section>
          <section id="brands" className="hp-brands hp-pattern">
            <div className="hp-container">
              <div className="hp-centered-heading">
                <h2>
                  Shop by <em>Brand</em>
                </h2>
                <p>Discover your favorite brands, all in one place.</p>
              </div>
              <div className="hp-carousel">
                <button
                  className="hp-carousel-arrow hp-arrow-left"
                  aria-label="Previous brands"
                  onClick={() => slideBrands(-1)}
                >
                  <ChevronLeft />
                </button>
                <SwipeLoop className="brand-carousel-viewport" label="Shop by Brand">
                  <div className="brand-carousel-track">
                    {[0, 1].map((copy) => (
                      <div
                        className={`hp-brand-grid${copy ? " brand-carousel-copy" : ""}`}
                        id={copy ? undefined : "brand-list"}
                        key={copy}
                        aria-hidden={copy ? true : undefined}
                      >
                        {[
                          ...brandNames.slice(brandPage),
                          ...brandNames.slice(0, brandPage),
                        ].map((name) => (
                          <button
                            className="hp-brand-tile"
                            key={name}
                            tabIndex={copy ? -1 : undefined}
                            onClick={() => setInfo(name)}
                          >
                            <Art name={`brand${brandNames.indexOf(name)}`} alt={`${name} logo`} />
                            <span>{name}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </SwipeLoop>
                <button
                  className="hp-carousel-arrow hp-arrow-right"
                  aria-label="Next brands"
                  onClick={() => slideBrands(1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </section>
          <section id="confidence" className="hp-confidence hp-container">
            <div className="hp-centered-heading">
              <h2>Shop with Confidence</h2>
            </div>
            <div className="hp-benefit-grid">
              {[
                { icon: Truck, title: "Free Shipping", copy: "On all orders" },
                {
                  icon: ShieldCheck,
                  title: "Secure Payments",
                  copy: "Protected checkout",
                },
                { icon: Package, title: "Easy Returns", copy: "7-day returns" },
                {
                  icon: Headphones,
                  title: "24/7 Support",
                  copy: "Always here to help",
                },
              ].map((x) => (
                <button
                  key={x.title}
                  onClick={() =>
                    setInfo(
                      x.title === "Secure Payments"
                        ? "Checkout"
                        : x.title === "24/7 Support"
                          ? "Contact us"
                          : "Shipping & returns",
                    )
                  }
                >
                  <span>
                    <x.icon size={27} />
                  </span>
                  <h3>{x.title}</h3>
                  <p>{x.copy}</p>
                </button>
              ))}
            </div>
          </section>
          <section id="journal" className="hp-journal">
            <div className="hp-container">
              <div className="hp-centered-heading">
                <h2>Latest Blogs &amp; News</h2>
                <p>
                  Stories, tips and inspiration from the world of modern beauty,
                  <br className="hp-desktop" /> wellness and everyday living.
                </p>
              </div>
              <BlogSlider>
                {journalPosts.map((p) => (
                  <button
                    className="hp-blog-card"
                    key={p.title}
                    onClick={() => window.location.assign(`/blog/${p.slug}`)}
                  >
                    <span className="hp-art" style={{ aspectRatio: "1.65" }}>
                      <img
                        src={p.image}
                        alt=""
                        width={900}
                        height={450}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </span>
                    <div>
                      <small>{p.tag}</small>
                      <h3>{p.title}</h3>
                      <span>
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </button>
                ))}
              </BlogSlider>
            </div>
          </section>
        </main>
      </div>
      <div className="toast hp-toast" role="status" aria-live="polite">
        {notice && (
          <>
            <Check size={18} />
            <span>{notice}</span>
            {addedId !== null && (
              <button
                onClick={() => {
                  setDrawer(true);
                  setNotice("");
                }}
              >
                View cart <ArrowRight size={14} />
              </button>
            )}
          </>
        )}
      </div>
      {modalOpen && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setDrawer(false);
              setSelected(null);
              setInfo(null);
            }
          }}
        >
          {drawer ? (
            <section
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bag-title"
            >
              <div className="modal-heading">
                <h2 id="bag-title">
                  Your cart <span>({count})</span>
                </h2>
                <button
                  ref={closeRef}
                  aria-label="Close cart"
                  onClick={() => setDrawer(false)}
                >
                  <X />
                </button>
              </div>
              {!cart.length ? (
                <div className="empty">
                  <ShoppingBag size={40} />
                  <h3>Your next good find awaits.</h3>
                  <p>Add something you love to your cart.</p>
                  <button
                    className="primary"
                    onClick={() => {
                      setDrawer(false);
                      browse();
                    }}
                  >
                    Explore the collection <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => {
                      const p = catalog.find((p) => p.id === item.id)!;
                      return (
                        <div className="cart-item" key={p.id}>
                          <img src={photo(p.image, 200)} alt={p.name} />
                          <div>
                            <h3>{p.name}</h3>
                            <p>{p.color}</p>
                            <strong>{money(p.price)}</strong>
                            <div className="quantity">
                              <button
                                aria-label={`Decrease ${p.name} quantity`}
                                onClick={() =>
                                  setCart((c) =>
                                    c.flatMap((i) =>
                                      i.id === p.id
                                        ? i.quantity === 1
                                          ? []
                                          : [{ ...i, quantity: i.quantity - 1 }]
                                        : [i],
                                    ),
                                  )
                                }
                              >
                                <Minus size={14} />
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                disabled={item.quantity >= p.stock}
                                aria-label={`Increase ${p.name} quantity`}
                                onClick={() => add(p)}
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                className="remove"
                                onClick={() =>
                                  setCart((c) => c.filter((i) => i.id !== p.id))
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cart-summary">
                    <div>
                      <span>Subtotal</span>
                      <strong>{money(total)}</strong>
                    </div>
                    <p>
                      {live
                        ? "Shipping is calculated at checkout. Prices include configured taxes."
                        : "Sample prices. Shipping and taxes are not configured."}
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        window.location.href = "/checkout";
                      }}
                    >
                      Proceed to checkout <ArrowRight size={18} />
                    </button>
                    <button
                      className="continue"
                      onClick={() => setDrawer(false)}
                    >
                      Continue exploring
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : selected ? (
            <section
              className="product-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-title"
            >
              <button
                className="modal-close"
                ref={closeRef}
                aria-label="Close product details"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
              <img src={photo(selected.image, 800)} alt={selected.name} />
              <div>
                <h2 id="product-title">{selected.name}</h2>
                <strong>{money(selected.price)}</strong>
                <p>{selected.description}</p>
                <div className="detail-line">
                  Color <b>{selected.color}</b>
                </div>
                <div className="detail-line">
                  {live || managed ? "Availability" : "Sample availability"}{" "}
                  <b>{selected.stock} units</b>
                </div>
                <button className="primary" onClick={() => add(selected)}>
                  Add to Cart <Plus size={18} />
                </button>
                <button
                  className="save-detail"
                  onClick={() => favorite(selected.id)}
                >
                  <Heart
                    size={17}
                    fill={saved.includes(selected.id) ? "currentColor" : "none"}
                  />
                  {saved.includes(selected.id)
                    ? "Saved to favorites"
                    : "Save for later"}
                </button>
                <small>
                  {live
                    ? "Please review the product details before ordering."
                    : "Sample product. Specifications require merchant verification before sale."}
                </small>
              </div>
            </section>
          ) : (
            <section
              className="info-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="info-title"
            >
              <button
                className="modal-close"
                ref={closeRef}
                aria-label="Close information"
                onClick={() => setInfo(null)}
              >
                <X />
              </button>
              <span className="info-star">✳</span>
              <h2 id="info-title">{requestedBrand ? "Contact us" : info}</h2>
              <p>{requestedBrand
                ? `Looking for a product from ${requestedBrand}? Contact us directly with your desired product or quotation request, and we’ll help you source it.`
                : policies[info!]}</p>
              {requestedBrand ? (
                <Link className="primary" href={`/contact?brand=${encodeURIComponent(requestedBrand)}`}>
                  Contact us <ArrowRight size={17} />
                </Link>
              ) : (
                <button className="primary" onClick={() => setInfo(null)}>
                  Got it <Check size={17} />
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}


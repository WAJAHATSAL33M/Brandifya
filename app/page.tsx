"use client";
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
import StoreHeader from "./store-header";
import art from "../lib/home-art.json";
import {
  categoryTiles,
  dealProducts,
  bestProducts,
  journalPosts,
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
  id.startsWith("/")
    ? id
    : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export default function Store() {
  const [catalog, setCatalog] = useState<Product[]>(products),
    [live, setLive] = useState(false);
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
  const [bestPage, setBestPage] = useState(0),
    [brandPage, setBrandPage] = useState(0);
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
  function slideBest(direction: number) {
    if (window.innerWidth > 900)
      setBestPage((page) => (page + direction + 5) % 5);
    else
      document
        .getElementById("best-products")
        ?.scrollBy({ left: direction * 250, behavior: "smooth" });
  }
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
    setNotice(`${p.name} added to your bag`);
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
    Brands:
      "Brand names are navigation placeholders from the supplied design. No affiliation or authorized reseller status is claimed. Verified branded inventory must be supplied before launch.",
    "About Brandifya":
      "Brandifya is a general-store concept bringing home, style, tech, and everyday essentials together. This storefront currently uses sample products and prices.",
    "Shipping & returns":
      "Delivery areas, shipping fees, timelines, and return terms will be published once the merchant confirms them. Products cannot currently be ordered.",
    "Contact us": process.env.NEXT_PUBLIC_SUPPORT_EMAIL
      ? `Contact our team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.`
      : "Customer support details are being set up. This demo does not collect contact requests.",
    Privacy:
      "Your bag and saved items are stored in this browser. When live checkout is enabled, delivery details are stored in the merchant database and card details are handled by Stripe. Newsletter signup stores your email with your consent. The merchant must publish a complete privacy policy and data retention terms before launch.",
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
          <section className="hp-categories hp-container">
            <h2>Shop by Category</h2>
            <p className="hp-subtitle">
              Explore the essentials across our most-loved departments.
            </p>
            <div className="hp-category-grid">
              {categoryTiles.map((c, i) => (
                <button
                  key={c.name}
                  className="hp-category"
                  onClick={() => browse(c.category)}
                >
                  {i === 5 ? (
                    <span className="compact-category-more" aria-hidden="true">
                      <b />
                      <b />
                      <b />
                    </span>
                  ) : (
                    <img
                      className="compact-category-image"
                      src={
                        [
                          "/categories/electronics.webp",
                          "/categories/fashion.webp",
                          "/categories/grocery.webp",
                          "/categories/home.webp",
                          "/categories/fitness.webp",
                        ][i]
                      }
                      alt=""
                      width={300}
                      height={300}
                    />
                  )}
                  <span>
                    {c.name}
                    <i>
                      <ArrowRight size={16} />
                    </i>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section id="shop" className="hp-featured hp-container">
            <h2>
              {savedOnly
                ? "Wishlist"
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
            <div className="hp-featured-grid">
              {visible.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  saved={saved.includes(p.id)}
                  onSave={() => favorite(p.id)}
                  live={live}
                />
              ))}
            </div>
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
                    className="primary"
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
                <button className="compact-view-all" onClick={() => browse()}>
                  View all
                  <ArrowRight size={16} />
                </button>
              </div>
              <div className="hp-six-grid">
                {live
                  ? catalog
                      .slice(0, 6)
                      .map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          saved={saved.includes(p.id)}
                          onSave={() => favorite(p.id)}
                          live
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
            <h2>Style, Care &amp; Tech for a Brighter You</h2>
            <p className="hp-subtitle">
              Discover top brands, exclusive offers and everything you need in
              one place.
            </p>
            <div className="hp-promo-grid compact-promos">
              {[
                { name: "Fashion", image: "/heroes/fashion.webp" },
                { name: "Beauty", image: "/heroes/shop-beauty.webp" },
                { name: "Tech", image: "/heroes/home-tech.webp" },
              ].map((c) => (
                <Link key={c.name} href={categoryHref(c.name)}>
                  <img
                    src={c.image}
                    alt=""
                    width={600}
                    height={300}
                    loading="lazy"
                  />
                  <div>
                    <h3>{c.name}</h3>
                    <span>
                      Explore collection
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="hp-best hp-pattern">
            <div className="hp-container">
              <div className="hp-centered-heading">
                <h2>
                  More to <em>Explore</em>
                </h2>
                <p>Discover more everyday finds across the collection.</p>
                <button className="hp-view-all" onClick={() => browse()}>
                  View All Products <ArrowRight size={16} />
                </button>
              </div>
              <div className="hp-carousel">
                <button
                  className="hp-carousel-arrow hp-arrow-left"
                  aria-label="Previous best selling products"
                  onClick={() => slideBest(-1)}
                >
                  <ChevronLeft />
                </button>
                <div className="hp-six-grid hp-scroll" id="best-products">
                  {live
                    ? catalog
                        .slice(0, 6)
                        .map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            saved={saved.includes(p.id)}
                            onSave={() => favorite(p.id)}
                            live
                          />
                        ))
                    : [
                        ...bestProducts.slice(bestPage),
                        ...bestProducts.slice(0, bestPage),
                      ].map((p) => (
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
                  aria-label="Next best selling products"
                  onClick={() => slideBest(1)}
                >
                  <ChevronRight />
                </button>
              </div>
              <div className="hp-dots" aria-label="Best seller carousel pages">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    aria-label={`Show best seller page ${i + 1}`}
                    aria-pressed={bestPage === i}
                    className={bestPage === i ? "active" : ""}
                    onClick={() => setBestPage(i)}
                  />
                ))}
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
                <div className="hp-brand-grid" id="brand-list">
                  {[
                    ...brandNames.slice(brandPage),
                    ...brandNames.slice(0, brandPage),
                  ].map((name) => (
                    <button
                      className="hp-brand-tile"
                      key={name}
                      onClick={() => setInfo("Brands")}
                    >
                      <Art
                        name={`brand${brandNames.indexOf(name)}`}
                        alt={`${name} logo`}
                      />
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
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
              <p>
                A better shopping experience, from checkout to your doorstep.
              </p>
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
              <div className="hp-blog-grid">
                {journalPosts.map((p, i) => (
                  <button
                    className="hp-blog-card"
                    key={p.title}
                    onClick={() => setInfo(p.title)}
                  >
                    <Art name={`blog${i}`} alt={p.title} />
                    <div>
                      <small>{p.tag}</small>
                      <h3>{p.title}</h3>
                      <span>
                        <ArrowRight size={17} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
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
                  Your bag <span>({count})</span>
                </h2>
                <button
                  ref={closeRef}
                  aria-label="Close bag"
                  onClick={() => setDrawer(false)}
                >
                  <X />
                </button>
              </div>
              {!cart.length ? (
                <div className="empty">
                  <ShoppingBag size={40} />
                  <h3>Your next good find awaits.</h3>
                  <p>Add something you love to your bag.</p>
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
                  {live ? "Availability" : "Sample availability"}{" "}
                  <b>{selected.stock} units</b>
                </div>
                <button className="primary" onClick={() => add(selected)}>
                  Add to bag <Plus size={18} />
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
              <h2 id="info-title">{info}</h2>
              <p>{policies[info!]}</p>
              <button className="primary" onClick={() => setInfo(null)}>
                Got it <Check size={17} />
              </button>
            </section>
          )}
        </div>
      )}
    </>
  );
}

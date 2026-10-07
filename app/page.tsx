"use client";
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
    [menu, setMenu] = useState(false),
    [savedOnly, setSavedOnly] = useState(false),
    [notice, setNotice] = useState(""),
    [info, setInfo] = useState<string | null>(null),
    [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [subscribing, setSubscribing] = useState(false),
    [catalogError, setCatalogError] = useState(false);
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
                typeof id === "number" && products.some((p) => p.id === id),
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
    const t = setTimeout(() => setNotice(""), 3000);
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
    setNotice(`${p.name} added to your bag`);
  }
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubscribing(true);
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setNotice("You are subscribed. Thank you!");
      setEmail("");
      setConsent(false);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setSubscribing(false);
    }
  }
  function favorite(id: number) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function browse(c = "All finds") {
    setCategory(c);
    setSavedOnly(false);
    setMenu(false);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }
  const policies: Record<string, string> = {
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
      <div className="announcement">
        A little discovery. A lot to love.{" "}
        <span>
          Meet your new everyday favorites <ArrowRight size={13} />
        </span>
      </div>
      <header>
        <div className="nav wrap">
          <a className="brand" href="/" aria-label="Brandifya home">
            <img
              src="/brande-logo.png"
              alt="Brande — Buy branded with Brande"
            />
          </a>
          <nav aria-label="Main navigation">
            <button onClick={() => browse()}>Shop all</button>
            <button onClick={() => browse("Home & Living")}>
              Home & living
            </button>
            <button onClick={() => browse("Fashion")}>Fashion</button>
            <button onClick={() => browse("Tech")}>Tech</button>
            <button onClick={() => setInfo("About Brandifya")}>
              Our story
            </button>
          </nav>
          <div className="nav-actions">
            <button
              aria-label="Search products"
              onClick={() => {
                browse();
                document.getElementById("search")?.focus();
              }}
            >
              <Search />
            </button>
            <button
              aria-label="View saved items"
              onClick={() => {
                setSavedOnly((v) => !v);
                setCategory("All finds");
                document
                  .getElementById("shop")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Heart fill={savedOnly ? "currentColor" : "none"} />
            </button>
            <button
              aria-label={`Open shopping bag, ${count} items`}
              onClick={() => setDrawer(true)}
            >
              <ShoppingBag />
              <span className="count">{count}</span>
            </button>
            <button
              className="mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Menu />
            </button>
          </div>
        </div>
        {menu && (
          <nav className="menu-panel" aria-label="Mobile navigation">
            {categories.map((c) => (
              <button key={c} onClick={() => browse(c)}>
                {c}
                <ArrowRight size={16} />
              </button>
            ))}
          </nav>
        )}
      </header>
      <main>
        {catalogError && (
          <p className="load-error" role="alert">
            Inventory is unavailable. Please refresh to try again.
          </p>
        )}
        <section className="reference-hero wrap">
          <button onClick={() => browse()} aria-label="Shop the collection">
            <img
              src="/home-banner.jpg"
              alt="Brande Blessed Friday promotional design — explore the sample collection"
              fetchPriority="high"
            />
          </button>
          <p className="hero-disclaimer">
            Promotional artwork from the supplied design. Offers shown are
            illustrative and are not currently active.
          </p>
        </section>
        <div className="values wrap">
          <span>
            <Package />
            Considered everyday essentials
          </span>
          <span>
            <ShieldCheck />
            Clear product information
          </span>
          <span>
            <Heart />
            Finds you’ll love coming back to
          </span>
        </div>
        <section className="category-section wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">SHOP BY CATEGORY</div>
              <h2>Shop by Category</h2>
            </div>
            <button className="text-link" onClick={() => browse()}>
              Explore all categories <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="category-grid">
            {[
              {
                name: "Tech",
                image: "/category-1.jpg",
                label: "Electronics for everyday",
              },
              {
                name: "Fashion",
                image: "/category-2.jpg",
                label: "Your everyday, styled",
              },
              {
                name: "Grocery",
                image: "/category-3.jpg",
                label: "Food and everyday essentials",
              },
              {
                name: "Home & Living",
                image: "/category-4.jpg",
                label: "For a home you love",
              },
              {
                name: "Sports & Fitness",
                image: "/category-5.jpg",
                label: "Make your next move",
              },
              {
                name: "All finds",
                image: "/category-6.jpg",
                label: "Discover more favorites",
              },
            ].map((c) => (
              <button
                key={c.name}
                className="category-card"
                onClick={() => browse(c.name)}
              >
                <div>
                  <img src={photo(c.image, 600)} alt="" loading="lazy" />
                  <span>
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <h3>{c.name}</h3>
                <p>{c.label}</p>
              </button>
            ))}
          </div>
        </section>
        <section id="shop" className="shop-section wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">CURATED FOR YOUR EVERYDAY</div>
              <h2>{savedOnly ? "Your saved finds." : "Featured Products"}</h2>
            </div>
            <span className="sample-tag">
              {live ? "Live collection" : "Sample collection · not live offers"}
            </span>
          </div>
          <div className="shop-tools">
            <div className="tabs" aria-label="Product categories">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  onClick={() => {
                    setCategory(c);
                    setSavedOnly(false);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="filter-row">
              <label className="search-box">
                <Search size={17} />
                <input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your next find…"
                  aria-label="Search products"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <label className="sort">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Sort products"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="name">Name: A–Z</option>
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
          </div>
          <div className="results-line">
            {visible.length} thoughtful finds{" "}
            {savedOnly && (
              <button onClick={() => setSavedOnly(false)}>
                Show all products
              </button>
            )}
          </div>
          <div className="product-grid">
            {visible.map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-image">
                  <button
                    className="product-open"
                    onClick={() => setSelected(p)}
                    aria-label={`View ${p.name}`}
                  >
                    <img
                      src={photo(p.image, 600)}
                      alt={p.name}
                      loading="lazy"
                    />
                  </button>
                  {p.badge && <span className="badge">{p.badge}</span>}
                  <button
                    className="favorite"
                    aria-label={`${saved.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
                    aria-pressed={saved.includes(p.id)}
                    onClick={() => favorite(p.id)}
                  >
                    <Heart
                      size={18}
                      fill={saved.includes(p.id) ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    className="quick-add"
                    disabled={p.stock < 1}
                    onClick={() => add(p)}
                  >
                    <Plus size={16} /> {p.stock < 1 ? "Sold out" : "Add to bag"}
                  </button>
                </div>
                <p className="product-category">{p.category}</p>
                <button className="product-name" onClick={() => setSelected(p)}>
                  {p.name}
                </button>
                <div className="product-bottom">
                  <span>{money(p.price)}</span>
                  <span className="color-dot" title={p.color} />
                </div>
              </article>
            ))}
          </div>
          {!visible.length && (
            <div className="empty">
              <Search size={32} />
              <h3>No finds just yet.</h3>
              <p>Try another search or category.</p>
              <button
                className="primary"
                onClick={() => {
                  setQuery("");
                  setCategory("All finds");
                  setSavedOnly(false);
                }}
              >
                See all finds <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
        <section className="deal-section wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow">MORE TO DISCOVER</div>
              <h2>Everyday favorites</h2>
            </div>
            <button className="text-link" onClick={() => browse()}>
              View all products <ArrowRight size={16} />
            </button>
          </div>
          <div className="deal-grid">
            {catalog.slice(4, 8).map((p) => (
              <article className="deal-card" key={p.id}>
                <button
                  style={{ padding: 0, width: "100%" }}
                  onClick={() => setSelected(p)}
                  aria-label={`View ${p.name}`}
                >
                  <img src={photo(p.image, 400)} alt={p.name} loading="lazy" />
                </button>
                <h3>{p.name}</h3>
                <strong>{money(p.price)}</strong>
                <button
                  className="primary"
                  disabled={!p.stock}
                  onClick={() => add(p)}
                >
                  <ShoppingBag size={14} />
                  {p.stock ? "Add to bag" : "Sold out"}
                </button>
              </article>
            ))}
          </div>
        </section>
        <section className="deal-section wrap">
          <div className="eyebrow">SHOP BY CATEGORY</div>
          <h2>Style, Care & Tech for a Brighter You</h2>
          <div className="promo-grid">
            {[
              {
                category: "Fashion",
                title: "Everyday style, your way",
                image: "/product-7.jpg",
              },
              {
                category: "Beauty",
                title: "A moment for yourself",
                image: "/product-6.jpg",
              },
              {
                category: "Tech",
                title: "Smarter everyday essentials",
                image: "/product-8.jpg",
              },
            ].map((x) => (
              <button
                className="promo-card"
                key={x.category}
                onClick={() => browse(x.category)}
              >
                <div>
                  <div className="eyebrow">{x.category}</div>
                  <h3>{x.title}</h3>
                  <span>Shop now →</span>
                </div>
                <img src={photo(x.image, 400)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </section>
        <section className="editorial wrap">
          <div className="editorial-image">
            <img
              src={photo("/category-4.jpg", 1000)}
              alt="Inviting living space with natural textures"
              loading="lazy"
            />
          </div>
          <div className="editorial-copy">
            <div className="eyebrow">LESS ORDINARY. MORE YOU.</div>
            <h2>
              It’s the little things
              <br />
              that make a <em>life.</em>
            </h2>
            <p>
              The perfect corner. Your go-to accessory. That small upgrade that
              makes every day feel better. We’re here to help you find them.
            </p>
            <button className="primary" onClick={() => browse("Home & Living")}>
              Make yourself at home <ArrowUpRight size={18} />
            </button>
          </div>
        </section>
        <section className="brands-section wrap">
          <div className="eyebrow">TOP BRANDS</div>
          <h2>
            Shop by <em>Brand</em>
          </h2>
          <p>Discover your favorites, all in one place.</p>
          <div className="brands-grid">
            {[
              "Apple",
              "Samsung",
              "Nike",
              "Adidas",
              "Sony",
              "Canon",
              "Lenovo",
              "Philips",
            ].map((name) => (
              <button key={name} onClick={() => setInfo("Brands")}>
                {name}
              </button>
            ))}
          </div>
        </section>
        <section className="confidence wrap">
          <div className="eyebrow">WHY SHOP WITH US</div>
          <h2>Shop with Confidence</h2>
          <p>A clear shopping experience, from discovery to your bag.</p>
          <div className="confidence-grid">
            {[
              {
                icon: Truck,
                title: "Delivery information",
                text: "Confirmed at checkout",
              },
              {
                icon: ShieldCheck,
                title: "Secure card checkout",
                text: "Stripe hosted payment",
              },
              {
                icon: Package,
                title: "Clear return terms",
                text: "Merchant policy required",
              },
              {
                icon: Heart,
                title: "Here to help",
                text: "Support setup in progress",
              },
            ].map((x) => (
              <div key={x.title}>
                <x.icon />
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="closing wrap">
          <span>✳</span>
          <div>
            <h2>A good find is just the beginning.</h2>
            <p>
              Explore, save your favorites, and make everyday a little more you.
            </p>
          </div>
          <button className="text-link" onClick={() => browse()}>
            Discover Brandifya <ArrowUpRight size={19} />
          </button>
        </section>
      </main>
      <section className="journal wrap">
        <div className="eyebrow">OUR JOURNAL</div>
        <h2>Latest Ideas & Inspiration</h2>
        <div className="journal-grid">
          {[
            {
              title: "A calmer home, one corner at a time",
              tag: "HOME · LIVING",
              image: "/category-4.jpg",
            },
            {
              title: "The everyday bag checklist",
              tag: "STYLE · EVERYDAY",
              image: "/product-1.jpg",
            },
            {
              title: "Make room for a simpler routine",
              tag: "BEAUTY · LIFESTYLE",
              image: "/product-6.jpg",
            },
          ].map((x) => (
            <button
              className="journal-card"
              key={x.title}
              onClick={() => setInfo(x.title)}
            >
              <img src={photo(x.image, 600)} alt="" loading="lazy" />
              <div>
                <small>{x.tag}</small>
                <h3>
                  {x.title} <ArrowUpRight size={13} />
                </h3>
              </div>
            </button>
          ))}
        </div>
      </section>
      <footer>
        <div className="footer-main wrap">
          <div>
            <a className="brand" href="/">
              <img
                src="/brande-logo.png"
                alt="Brande — Buy branded with Brande"
              />
            </a>
            <p>Buy branded with Brande.</p>
            <span className="footer-demo">
              {live ? "Storefront" : "Demo storefront"} · Prices in{" "}
              {process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR"}
            </span>
          </div>
          <div>
            <h3>Discover</h3>
            {["All finds", "Home & Living", "Fashion", "Tech"].map((c) => (
              <button key={c} onClick={() => browse(c)}>
                {c === "All finds" ? "Shop all" : c}
              </button>
            ))}
          </div>
          <div>
            <h3>Here to help</h3>
            {["Shipping & returns", "Contact us", "Privacy"].map((s) => (
              <button key={s} onClick={() => setInfo(s)}>
                {s}
              </button>
            ))}
          </div>
          <div>
            <h3>Subscribe.</h3>
            <p>Our conversation is just getting started.</p>
            <form className="newsletter" onSubmit={subscribe}>
              <input
                type="email"
                aria-label="Newsletter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                maxLength={254}
              />
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                />
                I agree to receive store updates by email.
              </label>
              <button className="primary" disabled={subscribing}>
                {subscribing ? "Subscribing…" : "Subscribe"}{" "}
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom wrap">
          <span>© {new Date().getFullYear()} Brandifya.</span>
          <span>Made for your everyday.</span>
        </div>
      </footer>
      <div className="toast" role="status" aria-live="polite">
        {notice && (
          <>
            <Check size={18} />
            {notice}
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
                <div className="eyebrow">{selected.category}</div>
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

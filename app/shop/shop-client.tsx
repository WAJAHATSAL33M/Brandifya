"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import StoreHeader from "../store-header";
import ProductCard from "../product-card";
import ShopOpening from "./shop-opening";
import CategoryOpening from "../category/category-opening";
import { categoryHref } from "../../lib/categories";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Search,
  ShoppingCart,
  Menu,
  X,
  SlidersHorizontal,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import {
  products,
  money,
  sanitizeCart,
  subtotal,
  type Product,
  type CartItem,
} from "../../lib/catalog";
const image = (src: string) =>
  src.startsWith("/")
    ? src
    : `https://images.unsplash.com/${src}?auto=format&fit=crop&w=800&q=85`;
const currency = process.env.NEXT_PUBLIC_STORE_CURRENCY || "PKR";
const sortOptions = ["featured", "low", "high", "name"];
const initial = {
  query: "",
  categories: [] as string[],
  min: "",
  max: "",
  color: "",
  stock: false,
  saved: false,
  sort: "featured",
};
type Filters = typeof initial;
function fromUrl(category?: string): Filters {
  const p = new URLSearchParams(window.location.search);
  if (category) return { ...initial, categories: [category], query: (p.get("q") || "").slice(0, 200) };
  const price = (key: string) => {
    const value = p.get(key) || "";
    return value && /^\d+(\.\d{1,2})?$/.test(value) ? value : "";
  };
  return {
    query: (p.get("q") || "").slice(0, 200),
    categories: category ? [category] : p.getAll("category"),
    min: price("min"),
    max: price("max"),
    color: p.get("color") || "",
    stock: p.get("stock") === "1",
    saved: p.get("saved") === "1",
    sort: sortOptions.includes(p.get("sort") || "")
      ? p.get("sort")!
      : "featured",
  };
}
export default function Shop({ category }: { category?: string } = {}) {
  const [catalog, setCatalog] = useState<Product[]>([]),
    [live, setLive] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>({
      ...initial,
      categories: category ? [category] : [],
    }),
    [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState<number[]>([]),
    [cart, setCart] = useState<CartItem[]>([]),
    [storageReady, setStorageReady] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false),
    [selected, setSelected] = useState<Product | null>(null),
    [bagOpen, setBagOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const modal = filtersOpen || !!selected || bagOpen;
  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function updatePrice(key: "min" | "max", value: string) {
    if (value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0))
      update(key, value);
  }
  function toggleCategory(category: string) {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(category)
        ? f.categories.filter((c) => c !== category)
        : [...f.categories, category],
    }));
  }
  async function loadCatalog() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.products)) throw new Error();
      setCatalog(data.products);
      setLive(data.live === true);
      setCart((c) => sanitizeCart(c, data.products));
    } catch {
      setError("We couldn’t load the products. Please try again.");
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setFilters(fromUrl(category));
    setInitialized(true);
    const restore = () => setFilters(fromUrl(category));
    window.addEventListener("popstate", restore);
    try {
      const value = JSON.parse(localStorage.getItem("brandifya-saved") || "[]");
      setSaved(
        Array.isArray(value)
          ? [
              ...new Set<number>(
                value.filter(
                  (id: unknown): id is number =>
                    typeof id === "number" &&
                    Number.isSafeInteger(id) &&
                    (id > 0 || (id >= -12 && id < 0)),
                ),
              ),
            ]
          : [],
      );
      const stored = JSON.parse(localStorage.getItem("brandifya-cart") || "[]");
      setCart(sanitizeCart(stored, products));
      // Reconcile live product IDs only after the authoritative catalog loads.
      if (Array.isArray(stored))
        setCart(
          stored.filter(
            (item) =>
              Number.isSafeInteger(item?.id) &&
              item.id > 0 &&
              Number.isSafeInteger(item.quantity) &&
              item.quantity > 0,
          ),
        );
    } catch {}
    setStorageReady(true);
    loadCatalog();
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (!initialized) return;
    const p = new URLSearchParams();
    if (filters.query) p.set("q", filters.query);
    if (!category) filters.categories.forEach((c) => p.append("category", c));
    if (filters.min) p.set("min", filters.min);
    if (filters.max) p.set("max", filters.max);
    if (filters.color) p.set("color", filters.color);
    if (filters.stock) p.set("stock", "1");
    if (filters.saved) p.set("saved", "1");
    if (filters.sort !== "featured") p.set("sort", filters.sort);
    const url = `${category ? categoryHref(category) : "/shop"}${p.size ? `?${p}` : ""}`;
    if (location.pathname + location.search !== url)
      history.replaceState(null, "", url);
  }, [filters, initialized, category]);
  useEffect(() => {
    if (storageReady)
      try {
        localStorage.setItem("brandifya-saved", JSON.stringify(saved));
        if (!loading && !error)
          localStorage.setItem("brandifya-cart", JSON.stringify(cart));
      } catch {}
  }, [saved, cart, storageReady, loading, error]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled])",
        ) || [],
      ).filter((n) => n.getClientRects().length > 0);
    focusable()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFiltersOpen(false);
        setSelected(null);
        setBagOpen(false);
      }
      if (e.key === "Tab") {
        const nodes = focusable(),
          first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [modal]);
  useEffect(() => {
    const resize = () => {
      if (window.innerWidth > 900) setFiltersOpen(false);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const categoryCounts = useMemo(
    () =>
      catalog.reduce<Record<string, number>>(
        (counts, p) => ({
          ...counts,
          [p.category]: (counts[p.category] || 0) + 1,
        }),
        {},
      ),
    [catalog],
  );
  const colors = useMemo(
    () =>
      [
        ...new Set(
          catalog
            .filter((p) => !category || p.category === category)
            .map((p) => p.color)
            .filter(Boolean),
        ),
      ].sort(),
    [catalog, category],
  );
  const invalidRange =
    filters.min !== "" &&
    filters.max !== "" &&
    Number(filters.min) > Number(filters.max);
  const results = useMemo(
    () =>
      catalog
        .filter(
          (p) =>
            (!filters.query ||
              `${p.name} ${p.category} ${p.color}`
                .toLowerCase()
                .includes(filters.query.trim().toLowerCase())) &&
            (!filters.categories.length ||
              filters.categories.includes(p.category)) &&
            (!filters.min || p.price >= Number(filters.min)) &&
            (!filters.max || p.price <= Number(filters.max)) &&
            (!filters.color || p.color === filters.color) &&
            (!filters.stock || p.stock > 0) &&
            (!filters.saved || saved.includes(p.id)),
        )
        .sort((a, b) =>
          filters.sort === "low"
            ? a.price - b.price
            : filters.sort === "high"
              ? b.price - a.price
              : filters.sort === "name"
                ? a.name.localeCompare(b.name)
                : a.id - b.id,
        ),
    [catalog, filters, saved],
  );
  const [limit, setLimit] = useState(12);
  useEffect(() => setLimit(12), [filters]);
  const activeCount =
    (category ? 0 : filters.categories.length) +
    Number(!!filters.min || !!filters.max) +
    Number(!!filters.color) +
    Number(filters.stock) +
    Number(filters.saved);
  const reset = () =>
    setFilters({ ...initial, categories: category ? [category] : [] });
  const favorite = (id: number) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const bagCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = saved.filter((id) =>
    catalog.some((p) => p.id === id),
  ).length;
  function add(p: Product) {
    const quantity = cart.find((item) => item.id === p.id)?.quantity || 0;
    if (quantity >= p.stock) {
      setNotice("Maximum available quantity reached");
      return;
    }
    setCart((items) =>
      quantity
        ? items.map((item) =>
            item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...items, { id: p.id, quantity: 1 }],
    );
    setNotice(`${p.name} added to your cart`);
  }
  function scrollResults() {
    document.getElementById("shop-results")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function chooseCategory(name: string | null) {
    if (name) window.location.assign(categoryHref(name));
    else {
      setFilters(initial);
      scrollResults();
    }
  }
  return (
    <div className={`hp shop-page ${category ? "category-page" : ""}`}>
      <a className="skip" href="#shop-results">
        Skip to products
      </a>
      <StoreHeader
        active="shop"
        wishlistCount={wishlistCount}
        bagCount={bagCount}
        wishlistActive={filters.saved}
        onWishlist={() => {
          if (category) window.location.assign("/shop?saved=1");
          else { update("saved", !filters.saved); scrollResults(); }
        }}
        onBag={() => window.location.assign("/cart")}
        query={filters.query}
        onQueryChange={(value) => update("query", value)}
        onSearch={() => scrollResults()}
      />
      <main className="shop-container">
        <nav className="shop-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          {category ? (
            <>
              <Link href="/shop">Shop</Link>
              <ChevronRight size={14} />
              <span aria-current="page">{category}</span>
            </>
          ) : (
            <span aria-current="page">Shop</span>
          )}
        </nav>
        {category ? (
          <CategoryOpening
            name={category}
            count={categoryCounts[category] || 0}
            loading={loading}
            failed={!!error}
            collections={Object.entries(categoryCounts).map(
              ([name, count]) => ({
                name,
                count,
                image: image(catalog.find((p) => p.category === name)!.image),
              }),
            )}
          />
        ) : (
          <ShopOpening
            categories={Object.entries(categoryCounts).map(([name, count]) => ({
              name,
              count,
              image: image(catalog.find((p) => p.category === name)!.image),
            }))}
            selected={filters.categories}
            total={catalog.length}
            onCategory={chooseCategory}
            onFilters={() => {
              if (window.innerWidth <= 900) setFiltersOpen(true);
              else {
                document
                  .getElementById("filter-title")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
                document
                  .querySelector<HTMLInputElement>(".shop-filters input")
                  ?.focus({ preventScroll: true });
              }
            }}
            onWishlist={() => {
              update("saved", true);
              scrollResults();
            }}
            onBag={() => window.location.assign("/cart")}
          />
        )}
        <div className="shop-layout">
          {filtersOpen && (
            <div
              className="shop-filter-backdrop"
              aria-hidden="true"
              onClick={() => setFiltersOpen(false)}
            />
          )}
          {!category && (<aside
            className={`shop-filters ${filtersOpen ? "is-open" : ""}`}
            {...(filtersOpen
              ? {
                  role: "dialog",
                  "aria-modal": true,
                  "aria-labelledby": "filter-title",
                  ref: dialogRef,
                }
              : { "aria-label": "Product filters" })}
          >
            <div className="shop-filter-heading">
              <h2 id="filter-title">Filters</h2>
              <button
                className="shop-filter-close"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <X size={22} />
              </button>
              <button className="shop-reset" onClick={reset}>
                Reset
              </button>
            </div>
            {!category && (
              <fieldset>
                <legend>Category</legend>
                {[
                  ...new Set([
                    ...Object.keys(categoryCounts),
                    ...filters.categories,
                  ]),
                ].map((category) => (
                  <label className="shop-check" key={category}>
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </fieldset>
            )}
            <fieldset>
              <legend>
                Price range <small>({currency})</small>
              </legend>
              <div className="shop-price-inputs">
                <label>
                  Min
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={filters.min}
                    aria-invalid={invalidRange}
                    onChange={(e) => updatePrice("min", e.target.value)}
                  />
                </label>
                <span>–</span>
                <label>
                  Max
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Any"
                    value={filters.max}
                    aria-invalid={invalidRange}
                    onChange={(e) => updatePrice("max", e.target.value)}
                  />
                </label>
              </div>
              {invalidRange && (
                <p className="shop-range-error" role="alert">
                  Minimum price must not exceed the maximum.
                </p>
              )}
            </fieldset>
            <fieldset>
              <legend>Color</legend>
              <label className="shop-color-label">
                Choose a color
                <select
                  aria-label="Filter by color"
                  value={filters.color}
                  onChange={(e) => update("color", e.target.value)}
                >
                  <option value="">All colors</option>
                  {[
                    ...new Set([
                      ...colors,
                      ...(filters.color ? [filters.color] : []),
                    ]),
                  ].map((color) => (
                    <option key={color}>{color}</option>
                  ))}
                </select>
              </label>
            </fieldset>
            <fieldset>
              <legend>Availability</legend>
              <label className="shop-check">
                <input
                  type="checkbox"
                  checked={filters.stock}
                  onChange={(e) => update("stock", e.target.checked)}
                />
                <span>In stock only</span>
              </label>
              <label className="shop-check">
                <input
                  type="checkbox"
                  checked={filters.saved}
                  onChange={(e) => update("saved", e.target.checked)}
                />
                <span>My favorites</span>
                <Heart size={15} />
              </label>
            </fieldset>
            <div className="shop-filter-apply">
              <button className="primary" onClick={() => setFiltersOpen(false)}>
                Show {results.length}{" "}
                {results.length === 1 ? "product" : "products"}
                <ArrowRight size={17} />
              </button>
            </div>
          </aside>)}
          <section
            id="shop-results"
            className="shop-results"
            aria-label="Products"
            aria-busy={loading}
          >
            <div className="shop-toolbar">
              {category ? (
                <form className="category-product-search" role="search" onSubmit={e => e.preventDefault()}>
                  <Search size={18} aria-hidden="true" />
                  <input type="search" aria-label={`Search ${category} products`} placeholder={`Search ${category}…`} maxLength={200} value={filters.query} onChange={e => update("query", e.target.value)} />
                  {filters.query && <button type="button" aria-label="Clear category search" onClick={() => update("query", "")}><X size={18} /></button>}
                </form>
              ) : (
              <div>
                <button
                  className="shop-filter-trigger"
                  aria-haspopup="dialog"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal size={17} />
                  Filters{activeCount > 0 && <span>{activeCount}</span>}
                </button>
                <label className="shop-sort">
                  Sort by
                  <select
                    value={filters.sort}
                    aria-label="Sort products"
                    onChange={(e) => update("sort", e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                    <option value="name">Name: A–Z</option>
                  </select>
                </label>
              </div>
              )}
            </div>
            {!category && (activeCount > 0 || filters.query) && (
              <div className="shop-active-filters" aria-label="Active filters">
                {filters.query && (
                  <button onClick={() => update("query", "")}>
                    “{filters.query}”<X size={13} />
                  </button>
                )}
                {!category &&
                  filters.categories.map((c) => (
                    <button key={c} onClick={() => toggleCategory(c)}>
                      {c}
                      <X size={13} />
                    </button>
                  ))}
                {(filters.min || filters.max) && (
                  <button
                    onClick={() =>
                      setFilters((f) => ({ ...f, min: "", max: "" }))
                    }
                  >
                    {currency} {filters.min || "0"} – {filters.max || "Any"}
                    <X size={13} />
                  </button>
                )}
                {filters.color && (
                  <button onClick={() => update("color", "")}>
                    {filters.color}
                    <X size={13} />
                  </button>
                )}
                {filters.stock && (
                  <button onClick={() => update("stock", false)}>
                    In stock
                    <X size={13} />
                  </button>
                )}
                {filters.saved && (
                  <button onClick={() => update("saved", false)}>
                    Favorites
                    <X size={13} />
                  </button>
                )}
                <button className="shop-clear-all" onClick={reset}>
                  Clear all
                </button>
              </div>
            )}
            {loading ? (
              <div className="shop-grid" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <div className="shop-skeleton" key={i}>
                    <div />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="shop-empty" role="alert">
                <Search size={32} />
                <h2>Products unavailable</h2>
                <p>{error}</p>
                <button className="primary" onClick={loadCatalog}>
                  Try again
                </button>
              </div>
            ) : !results.length ? (
              <div className="shop-empty">
                <Search size={32} />
                <h2>
                  {invalidRange
                    ? "Check your price range"
                    : category && !categoryCounts[category]
                      ? "No products in this collection"
                      : filters.saved
                        ? "No saved products match"
                        : "No products found"}
                </h2>
                <p>
                  {category && !categoryCounts[category]
                    ? "Explore another collection to discover your next favorite."
                    : filters.saved
                      ? "Save products with the heart icon, or clear your filters to keep exploring."
                      : "Try a different search or remove a filter to see more products."}
                </p>
                {category && !categoryCounts[category] ? (
                  <Link className="primary" href="/shop">
                    Explore all products
                    <ArrowRight size={17} />
                  </Link>
                ) : (
                  <button className={category ? "primary" : "primary store-view-all"} onClick={reset}>
                    {category ? "Clear search" : "View all products"}
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="shop-grid">
                  {results.slice(0, limit).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      saved={saved.includes(p.id)}
                      onSave={() => favorite(p.id)}
                      live={live}
                    />
                  ))}
                </div>
                {results.length > limit && (
                  <div className="shop-load-more">
                    <button
                      className="primary"
                      onClick={() => setLimit((n) => n + 12)}
                    >
                      Load more products
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
            {!category && !live && !loading && !error && (
              <p className="shop-demo">
                Sample catalog. Product details and availability require
                merchant verification before sale.
              </p>
            )}
          </section>
        </div>
      </main>

      {notice && (
        <div className="toast hp-toast" role="status">
          <Check size={18} />
          <span>{notice}</span>
        </div>
      )}
      {(selected || bagOpen) && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) {
              setSelected(null);
              setBagOpen(false);
            }
          }}
        >
          {selected ? (
            <section
              className="product-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-title"
              ref={dialogRef}
            >
              <button
                className="modal-close"
                aria-label="Close product details"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
              <img src={image(selected.image)} alt={selected.name} />
              <div>
                <h2 id="product-title">{selected.name}</h2>
                <strong>{money(selected.price)}</strong>
                <p>{selected.description}</p>
                <div className="detail-line">
                  Color<b>{selected.color}</b>
                </div>
                <div className="detail-line">
                  {live ? "Availability" : "Sample availability"}
                  <b>
                    {selected.stock > 0
                      ? `${selected.stock} units`
                      : "Sold out"}
                  </b>
                </div>
                <button
                  className="primary"
                  disabled={selected.stock <= 0}
                  onClick={() => add(selected)}
                >
                  Add to Cart
                  <Plus size={17} />
                </button>
                <button
                  className="save-detail"
                  aria-pressed={saved.includes(selected.id)}
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
              </div>
            </section>
          ) : (
            <section
              className="cart-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="bag-title"
              ref={dialogRef}
            >
              <div className="cart-header">
                <h2 id="bag-title">Your shopping cart</h2>
                <button
                  aria-label="Close shopping cart"
                  onClick={() => setBagOpen(false)}
                >
                  <X />
                </button>
              </div>
              {!cart.length ? (
                <div className="shop-empty">
                  <ShoppingCart size={32} />
                  <h3>Your cart is empty</h3>
                  <p>
                    Open a product to explore its details and add it to your
                    cart.
                  </p>
                  <button className="primary" onClick={() => setBagOpen(false)}>
                    Continue shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => {
                      const p = catalog.find((p) => p.id === item.id);
                      return (
                        p && (
                          <div className="cart-item" key={p.id}>
                            <img src={image(p.image)} alt={p.name} />
                            <div>
                              <h3>{p.name}</h3>
                              <p>{money(p.price)}</p>
                              <div className="quantity">
                                <button
                                  aria-label={`Decrease ${p.name} quantity`}
                                  onClick={() =>
                                    setCart((items) =>
                                      items.flatMap((i) =>
                                        i.id === p.id
                                          ? i.quantity > 1
                                            ? [
                                                {
                                                  ...i,
                                                  quantity: i.quantity - 1,
                                                },
                                              ]
                                            : []
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
                                    setCart((items) =>
                                      items.filter((i) => i.id !== p.id),
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      );
                    })}
                  </div>
                  <div className="cart-summary">
                    <div>
                      <span>Subtotal</span>
                      <strong>{money(subtotal(cart, catalog))}</strong>
                    </div>
                    <p>
                      {live
                        ? "Shipping is calculated at checkout."
                        : "Sample prices. Live ordering is not enabled."}
                    </p>
                    <Link className="primary" href="/checkout">
                      Proceed to checkout
                      <ArrowRight size={17} />
                    </Link>
                    <button
                      className="continue"
                      onClick={() => setBagOpen(false)}
                    >
                      Continue shopping
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}


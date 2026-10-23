"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Image as ImageIcon,
  Package,
  Upload,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react";
import type { AdminApi, Row } from "./workspace-utils";
import { money, downloadCsv } from "./workspace-utils";
const local = (s: unknown) =>
  s
    ? new Date(
        new Date(String(s)).getTime() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
const blank = () => ({
  id: null,
  name: "",
  description: "",
  category: "Accessories",
  image: "",
  color: "",
  price: "",
  originalPrice: "",
  stock: 0,
  expectedStock: undefined,
  sku: "",
  supplier: "",
  location: "",
  cost: 0,
  reorderLevel: 3,
  status: "draft",
  categoryId: "",
  brandId: "",
  tagIds: [] as number[],
  vendor: "",
  barcode: "",
  weightGrams: 0,
  requiresShipping: true,
  seoTitle: "",
  seoDescription: "",
  badge: "",
  rating: "",
  reviewCount: 0,
  soldCount: 0,
  promotionActive: false,
  promotionStartsAt: "",
  promotionEndsAt: "",
  media: [] as Row[],
  attributes: [] as Row[],
});
function fromRow(p: Row): Row {
  return {
    ...blank(),
    ...p,
    price: p.price_minor / 100,
    originalPrice: p.original_price_minor ? p.original_price_minor / 100 : "",
    expectedStock: p.stock,
    status: p.product_status || (p.active ? "active" : "draft"),
    categoryId: p.category_id || "",
    brandId: p.brand_id || "",
    tagIds: Array.isArray(p.tag_ids) ? p.tag_ids : [],
    cost: Number(p.cost_minor || 0) / 100,
    reorderLevel: p.reorder_level ?? 3,
    sku: p.sku || "",
    supplier: p.supplier || "",
    location: p.location || "",
    vendor: p.vendor || "",
    barcode: p.barcode || "",
    weightGrams: p.weight_grams || 0,
    requiresShipping:
      p.requires_shipping !== 0 && p.requires_shipping !== false,
    seoTitle: p.seo_title || "",
    seoDescription: p.seo_description || "",
    rating: p.rating ?? "",
    reviewCount: p.review_count || 0,
    soldCount: p.sold_count || 0,
    promotionActive: !!p.promotion_active,
    promotionStartsAt: local(p.promotion_starts_at),
    promotionEndsAt: local(p.promotion_ends_at),
    media: p.media || [],
    attributes: Object.entries(p.attributes || {}).map(([name, value]) => ({
      name,
      value,
    })),
  };
}
const badges = [
  "",
  "New Arrival",
  "Best Seller",
  "Top Rated",
  "Star Seller",
  "Featured",
  "Flash Sale",
  "Ends Soon",
  "Trending",
  "Lightning Deal",
  "Countdown Timer",
  "Few Left",
  "Almost Sold Out",
  "Early Bird Price",
  "Sold Out",
];
export default function ProductManager({
  api,
  onDirtyChange,
  initialQuery = "",
}: {
  api: AdminApi;
  onDirtyChange: (dirty: boolean) => void;
  initialQuery?: string;
}) {
  const [products, setProducts] = useState<Row[]>([]),
    [terms, setTerms] = useState<Row[]>([]),
    [query, setQuery] = useState(initialQuery),
    [status, setStatus] = useState("all"),
    [category, setCategory] = useState(""),
    [brand, setBrand] = useState(""),
    [selected, setSelected] = useState<number[]>([]),
    [draft, setDraft] = useState<Row | null>(null),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [library, setLibrary] = useState<Row[] | null>(null),
    [libraryPage, setLibraryPage] = useState(0),
    [page, setPage] = useState(0);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  async function load() {
    setError("");
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api("/api/admin/products"),
        api("/api/admin/taxonomy"),
      ]);
      setProducts(p.products);
      setTerms(t.terms);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [api]);
  function update(key: string, value: unknown) {
    setDraft((p) => (p ? { ...p, [key]: value } : p));
    setDirty(true);
    setMessage("");
  }
  function edit(p?: Row, duplicate = false) {
    if (dirty && !confirm("Discard unsaved product changes?")) return;
    const next = p ? fromRow(p) : blank();
    if (duplicate) {
      next.id = null;
      next.name += " (copy)";
      next.status = "draft";
      next.sku = "";
      next.barcode = "";
      next.expectedStock = undefined;
    }
    setDraft(next);
    setDirty(duplicate);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const names = draft.attributes
        .filter((a: Row) => a.name.trim())
        .map((a: Row) => a.name.trim());
      if (new Set(names).size !== names.length)
        throw Error("Specification names must be unique.");
      const body = {
        id: draft.id,
        name: draft.name,
        description: draft.description,
        category: draft.category,
        image: draft.image,
        color: draft.color,
        priceMinor: Math.round(Number(draft.price) * 100),
        originalPriceMinor:
          draft.originalPrice === ""
            ? null
            : Math.round(Number(draft.originalPrice) * 100),
        stock: Number(draft.stock),
        expectedStock: draft.expectedStock,
        active: draft.status === "active",
        badge: draft.badge,
        rating: draft.rating === "" ? null : Number(draft.rating),
        reviewCount: Number(draft.reviewCount),
        soldCount: Number(draft.soldCount),
        promotionActive: draft.promotionActive,
        promotionStartsAt: draft.promotionStartsAt
          ? new Date(draft.promotionStartsAt).toISOString()
          : null,
        promotionEndsAt: draft.promotionEndsAt
          ? new Date(draft.promotionEndsAt).toISOString()
          : null,
        media: draft.media,
        attributes: Object.fromEntries(
          draft.attributes
            .filter((a: Row) => a.name.trim())
            .map((a: Row) => [a.name.trim(), a.value]),
        ),
        organization: {
          categoryId: draft.categoryId ? Number(draft.categoryId) : null,
          brandId: draft.brandId ? Number(draft.brandId) : null,
          tagIds: draft.tagIds.map(Number),
          status: draft.status,
          vendor: draft.vendor,
          barcode: draft.barcode,
          weightGrams: Number(draft.weightGrams),
          requiresShipping: draft.requiresShipping,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
        },
        inventory: {
          sku: draft.sku,
          supplier: draft.supplier,
          location: draft.location,
          costMinor: Math.round(Number(draft.cost) * 100),
          reorderLevel: Number(draft.reorderLevel),
        },
      };
      const r = await api("/api/admin/products", "POST", body);
      setDirty(false);
      await load();
      const list = await api("/api/admin/products");
      const p = list.products.find((p: Row) => p.id === r.id);
      if (p) setDraft(fromRow(p));
      setMessage("Product saved successfully.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length || !draft) return;
    setBusy(true);
    setError("");
    try {
      const media = [...draft.media];
      let cover = draft.image;
      for (const file of Array.from(files)) {
        if (media.length >= 12) throw Error("Use up to 12 gallery items.");
        const form = new FormData();
        form.set("file", file);
        const r = await fetch("/api/admin/media", {
            method: "POST",
            body: form,
          }),
          d = await r.json();
        if (!r.ok) throw Error(d.error || "Upload failed.");
        media.push({
          url: d.url,
          type: d.type,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });
        if (!cover && d.type === "image") cover = d.url;
        setDraft((p) => (p ? { ...p, media: [...media], image: cover } : p));
        setDirty(true);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function showLibrary(page = 0) {
    try {
      const d = await api("/api/admin/media?offset=" + page * 48);
      setLibrary(d.media);
      setLibraryPage(page);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function bulk(next: string) {
    if (!selected.length) return;
    if (
      next === "archived" &&
      !confirm(
        "Archive the selected products? They will be hidden from the store.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/products/bulk", "POST", {
        ids: selected,
        status: next,
      });
      setSelected([]);
      await load();
      setMessage("Selected products updated.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = products.filter(
    (p) =>
      (status === "all" || p.product_status === status) &&
      (!category || p.category === category) &&
      (!brand || String(p.brand_id) === brand) &&
      `${p.name} ${p.sku || ""} ${p.category} ${p.brand_name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visible = filtered.slice(page * 25, (page + 1) * 25),
    active = products.filter((p) => p.active).length;
  const input = (
    key: string,
    label: string,
    type = "text",
    props: Row = {},
  ) => (
    <label>
      {label}
      <input
        type={type}
        value={draft?.[key] ?? ""}
        onChange={(e) => update(key, e.target.value)}
        {...props}
      />
    </label>
  );
  return (
    <section className="admin-module console-products">
      {error && (
        <p role="alert" className="management-alert">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="management-message">
          {message}
        </p>
      )}
      {!draft ? (
        <>
          <div className="console-section-tools">
            <div className="console-segmented" aria-label="Product status">
              {[
                ["all", "All", products.length],
                ["active", "Active", active],
                [
                  "draft",
                  "Draft",
                  products.filter((p) => p.product_status === "draft").length,
                ],
                [
                  "archived",
                  "Archived",
                  products.filter((p) => p.product_status === "archived")
                    .length,
                ],
              ].map(([value, label, count]) => (
                <button
                  key={String(value)}
                  aria-pressed={status === value}
                  onClick={() => {
                    setStatus(String(value));
                    setPage(0);
                    setSelected([]);
                  }}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
            <div className="admin-inline-actions">
              <button
                disabled={busy}
                onClick={() =>
                  downloadCsv(
                    "brande-products.csv",
                    filtered.map((p) => ({
                      ID: p.id,
                      Title: p.name,
                      SKU: p.sku,
                      Category: p.category,
                      Brand: p.brand_name,
                      Status: p.product_status,
                      Price: p.price_minor / 100,
                      Stock: p.stock,
                    })),
                  )
                }
              >
                Export
              </button>
              <button className="console-primary" onClick={() => edit()}>
                <Plus size={16} /> Add product
              </button>
            </div>
          </div>
          <div className="console-product-metrics">
            <div>
              <Package size={18} />
              <span>Total products</span>
              <strong>{products.length}</strong>
            </div>
            <div>
              <span className="console-dot green" />
              <span>Available online</span>
              <strong>{active}</strong>
            </div>
            <div>
              <span className="console-dot amber" />
              <span>Low stock</span>
              <strong>
                {
                  products.filter((p) => p.active && p.stock <= p.reorder_level)
                    .length
                }
              </strong>
            </div>
          </div>
          <div className="console-list-card">
            <div className="console-list-filters">
              <label className="console-search">
                <Search size={16} />
                <input
                  aria-label="Search products"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search by product, SKU or brand…"
                />
              </label>
              <select
                aria-label="Filter product category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All categories</option>
                {Array.from(new Set(products.map((p) => p.category))).map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
              <select
                aria-label="Filter product brand"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All brands</option>
                {terms
                  .filter((t) => t.kind === "brand")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            {selected.length > 0 && (
              <div className="console-bulk-bar">
                <strong>{selected.length} selected</strong>
                <button disabled={busy} onClick={() => bulk("active")}>
                  Publish
                </button>
                <button disabled={busy} onClick={() => bulk("draft")}>
                  Move to draft
                </button>
                <button disabled={busy} onClick={() => bulk("archived")}>
                  Archive
                </button>
                <button onClick={() => setSelected([])}>Clear</button>
              </div>
            )}
            {loading ? (
              <div className="console-loading" role="status">
                Loading your catalog…
              </div>
            ) : (
              <div className="management-table-wrap">
                <table className="management-table console-product-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Select products on this page"
                          checked={
                            visible.length > 0 &&
                            visible.every((p) => selected.includes(p.id))
                          }
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [
                                    ...new Set([
                                      ...selected,
                                      ...visible.map((p) => p.id),
                                    ]),
                                  ]
                                : selected.filter(
                                    (id) => !visible.some((p) => p.id === id),
                                  ),
                            )
                          }
                        />
                      </th>
                      <th>Product</th>
                      <th>Status</th>
                      <th>Inventory</th>
                      <th>Category / brand</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p) => (
                      <tr
                        key={p.id}
                        className={selected.includes(p.id) ? "is-selected" : ""}
                      >
                        <td>
                          <input
                            type="checkbox"
                            aria-label={"Select " + p.name}
                            checked={selected.includes(p.id)}
                            onChange={(e) =>
                              setSelected((ids) =>
                                e.target.checked
                                  ? [...ids, p.id]
                                  : ids.filter((id) => id !== p.id),
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="console-product-name"
                            onClick={() => edit(p)}
                          >
                            {p.image ? (
                              <img
                                src={
                                  p.image.startsWith("photo-")
                                    ? `https://images.unsplash.com/${p.image}?w=100`
                                    : p.image
                                }
                                alt=""
                              />
                            ) : (
                              <span>
                                <ImageIcon size={18} />
                              </span>
                            )}
                            <span>
                              <strong>{p.name}</strong>
                              <small>
                                {p.sku || "No SKU"} · #{p.id}
                              </small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span
                            className={
                              "admin-pill " + (p.active ? "healthy" : "draft")
                            }
                          >
                            {p.product_status}
                          </span>
                        </td>
                        <td>
                          <strong
                            className={p.stock === 0 ? "admin-negative" : ""}
                          >
                            {p.stock} available
                          </strong>
                          <small>
                            {p.stock === 0
                              ? "Out of stock"
                              : p.stock <= p.reorder_level
                                ? "Reorder suggested"
                                : "In stock"}
                          </small>
                        </td>
                        <td>
                          {p.category}
                          <small>{p.brand_name || "No brand"}</small>
                        </td>
                        <td>
                          {money(p.price_minor, p.currency)}
                          {p.original_price_minor && (
                            <small>
                              <s>{money(p.original_price_minor, p.currency)}</s>
                            </small>
                          )}
                        </td>
                        <td>
                          <div className="admin-inline-actions">
                            <button onClick={() => edit(p)}>Edit</button>
                            <button
                              title="Duplicate as draft"
                              aria-label={"Duplicate " + p.name}
                              onClick={() => edit(p, true)}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filtered.length && (
                  <div className="console-empty">
                    <span className="console-icon-tile">
                      <Package size={30} />
                    </span>
                    <h3>
                      {products.length
                        ? "No products match these filters"
                        : "Your next great product starts here"}
                    </h3>
                    <p>
                      {products.length
                        ? "Try another search or clear your filters."
                        : "Add your first product, complete its details and publish when you’re ready."}
                    </p>
                    <div className="admin-inline-actions">
                      <button
                        className="console-primary"
                        onClick={() => edit()}
                      >
                        Add product
                      </button>
                      {!products.length && (
                        <button
                          disabled={busy}
                          onClick={async () => {
                            if (
                              !confirm(
                                "Import demo products as drafts? Existing product IDs will be preserved. This is disabled on live stores.",
                              )
                            )
                              return;
                            setBusy(true);
                            try {
                              const r = await api(
                                "/api/admin/products/import-demo",
                                "POST",
                                {},
                              );
                              await load();
                              setMessage(
                                r.created +
                                  " demo products added as drafts. Review before publishing.",
                              );
                            } catch (e) {
                              setError((e as Error).message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Import demo products
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="console-list-pagination">
              <span>
                {filtered.length
                  ? `${page * 25 + 1}–${Math.min((page + 1) * 25, filtered.length)}`
                  : "0"}{" "}
                of {filtered.length} products
              </span>
              <div>
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </button>
                <button
                  disabled={(page + 1) * 25 >= filtered.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={save} className="console-product-form">
          <div className="console-edit-toolbar">
            <button
              type="button"
              aria-label="Back to products"
              onClick={() => {
                if (!dirty || confirm("Discard unsaved product changes?")) {
                  setDraft(null);
                  setDirty(false);
                }
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>{draft.id ? draft.name || "Edit product" : "Add product"}</h2>
              <small>{dirty ? "Unsaved changes" : "All changes saved"}</small>
            </div>
            {draft.id && draft.status === "active" && (
              <a
                className="console-link-button"
                href={"/product/" + draft.id}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} /> Preview
              </a>
            )}
            <button className="console-primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save product"}
            </button>
          </div>
          <div className="console-product-layout">
            <div>
              <section className="management-panel">
                <div className="console-card-title">
                  <h3>Product details</h3>
                </div>
                {input("name", "Title", "text", {
                  required: true,
                  maxLength: 200,
                  placeholder: "e.g. Everyday Leather Backpack",
                })}
                <label>
                  Description
                  <textarea
                    rows={6}
                    value={draft.description}
                    onChange={(e) => update("description", e.target.value)}
                    maxLength={10000}
                    placeholder="Tell customers what makes this product useful. Include materials, dimensions and care instructions."
                  />
                </label>
              </section>
              <section className="management-panel">
                <div className="console-card-title">
                  <h3>Media</h3>
                  <button type="button" onClick={() => showLibrary()}>
                    Browse library
                  </button>
                </div>
                <label className="console-dropzone">
                  <Upload size={25} />
                  <strong>Add product images or video</strong>
                  <span>
                    PNG, JPEG, WebP or MP4 · Up to 20 MB each · 12 gallery items
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,video/mp4"
                    disabled={busy}
                    onChange={(e) => {
                      void upload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="console-two-cols">
                  {input("image", "Main image URL", "text", {
                    required: true,
                    placeholder: "/products/image.webp or https://…",
                  })}
                  {input("color", "Color / finish", "text", { maxLength: 100 })}
                </div>
                {draft.image && (
                  <img
                    className="console-main-preview"
                    src={
                      draft.image.startsWith("photo-")
                        ? `https://images.unsplash.com/${draft.image}?w=400`
                        : draft.image
                    }
                    alt="Main product preview"
                  />
                )}
                <div className="console-gallery">
                  {draft.media.map((m: Row, i: number) => (
                    <div className="console-gallery-item" key={i}>
                      {m.type === "video" ? (
                        <video src={m.url} controls preload="metadata" />
                      ) : (
                        <img src={m.url} alt={m.alt} />
                      )}
                      <input
                        aria-label={"Media " + (i + 1) + " URL"}
                        value={m.url}
                        onChange={(e) =>
                          update(
                            "media",
                            draft.media.map((x: Row, j: number) =>
                              i === j ? { ...x, url: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={"Media " + (i + 1) + " alternative text"}
                        value={m.alt}
                        onChange={(e) =>
                          update(
                            "media",
                            draft.media.map((x: Row, j: number) =>
                              i === j ? { ...x, alt: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Alternative text"
                        maxLength={200}
                      />
                      <div className="admin-inline-actions">
                        <button
                          type="button"
                          aria-label="Move media earlier"
                          disabled={!i}
                          onClick={() => {
                            const a = [...draft.media];
                            [a[i - 1], a[i]] = [a[i], a[i - 1]];
                            update("media", a);
                          }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label="Move media later"
                          disabled={i === draft.media.length - 1}
                          onClick={() => {
                            const a = [...draft.media];
                            [a[i + 1], a[i]] = [a[i], a[i + 1]];
                            update("media", a);
                          }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove media"
                          onClick={() =>
                            update(
                              "media",
                              draft.media.filter(
                                (_: Row, j: number) => i !== j,
                              ),
                            )
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={draft.media.length >= 12}
                  onClick={() =>
                    update("media", [
                      ...draft.media,
                      { type: "image", url: "", alt: "" },
                    ])
                  }
                >
                  + Add image URL
                </button>
                {library && (
                  <section className="console-media-library">
                    <div className="console-card-title">
                      <h4>Media library</h4>
                      <button type="button" onClick={() => setLibrary(null)}>
                        Close
                      </button>
                    </div>
                    <div className="admin-media-grid">
                      {library.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          disabled={draft.media.length >= 12}
                          onClick={() => {
                            update("media", [
                              ...draft.media,
                              {
                                type: m.mime_type.startsWith("video")
                                  ? "video"
                                  : "image",
                                url: m.url,
                                alt: "",
                              },
                            ]);
                            if (!draft.image && m.mime_type.startsWith("image"))
                              update("image", m.url);
                            setLibrary(null);
                          }}
                        >
                          {m.mime_type.startsWith("image") ? (
                            <img src={m.url} alt="Uploaded media" />
                          ) : (
                            <span>Video</span>
                          )}
                          <small>{Math.round(m.size / 1024)} KB</small>
                        </button>
                      ))}
                    </div>
                    <div className="admin-pagination">
                      <button
                        type="button"
                        disabled={libraryPage === 0}
                        onClick={() => showLibrary(libraryPage - 1)}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={library.length < 48}
                        onClick={() => showLibrary(libraryPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </section>
                )}
              </section>
              <section className="management-panel">
                <h3>Pricing</h3>
                <div className="console-two-cols">
                  {input("price", "Selling price", "number", {
                    required: true,
                    min: 0.01,
                    step: 0.01,
                  })}
                  {input(
                    "originalPrice",
                    "Compare-at / original price",
                    "number",
                    { min: 0.01, step: 0.01 },
                  )}
                  {input("cost", "Cost per item", "number", {
                    min: 0,
                    step: 0.01,
                    required: true,
                  })}
                  <div className="console-price-insight">
                    <small>Estimated gross margin</small>
                    <strong>
                      {Number(draft.price) > 0
                        ? (
                            ((Number(draft.price) - Number(draft.cost)) /
                              Number(draft.price)) *
                            100
                          ).toFixed(1) + "%"
                        : "—"}
                    </strong>
                    <span>Before shipping, taxes and payment fees</span>
                  </div>
                </div>
              </section>
              <section className="management-panel">
                <h3>Inventory</h3>
                <div className="console-two-cols">
                  {input("sku", "SKU", "text", { maxLength: 100 })}
                  {input("barcode", "Barcode / GTIN", "text", {
                    maxLength: 100,
                  })}
                  {input("stock", "Available quantity", "number", {
                    required: true,
                    min: 0,
                    step: 1,
                  })}
                  {input("reorderLevel", "Reorder threshold", "number", {
                    required: true,
                    min: 0,
                    step: 1,
                  })}
                  {input("location", "Storage location", "text", {
                    maxLength: 120,
                  })}
                  {input("supplier", "Supplier", "text", { maxLength: 200 })}
                </div>
                <p className="console-help">
                  Saved quantity changes are recorded in stock history. Use
                  Inventory for adjustments with a specific reason.
                </p>
              </section>
              <section className="management-panel">
                <h3>Shipping</h3>
                <label className="console-checkbox">
                  <input
                    type="checkbox"
                    checked={draft.requiresShipping}
                    onChange={(e) =>
                      update("requiresShipping", e.target.checked)
                    }
                  />{" "}
                  Physical product requiring shipping
                </label>
                {draft.requiresShipping &&
                  input("weightGrams", "Weight (grams)", "number", {
                    min: 0,
                    step: 1,
                  })}
                <p className="console-help">
                  Stored for fulfilment reference. This does not change your
                  store’s configured shipping fee.
                </p>
              </section>
              <section className="management-panel">
                <div className="console-card-title">
                  <h3>Specifications</h3>
                  <button
                    type="button"
                    onClick={() =>
                      update("attributes", [
                        ...draft.attributes,
                        { name: "", value: "" },
                      ])
                    }
                  >
                    Add specification
                  </button>
                </div>
                <p className="console-help">
                  Use the same details shown on demo products: material,
                  dimensions, sizes, care, warranty or other attributes.
                </p>
                {draft.attributes.map((a: Row, i: number) => (
                  <div className="console-specification" key={i}>
                    <input
                      aria-label={"Specification " + (i + 1) + " name"}
                      placeholder="e.g. Material"
                      value={a.name}
                      maxLength={100}
                      onChange={(e) =>
                        update(
                          "attributes",
                          draft.attributes.map((x: Row, j: number) =>
                            i === j ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      aria-label={"Specification " + (i + 1) + " value"}
                      placeholder="e.g. Leather"
                      maxLength={1000}
                      value={a.value}
                      onChange={(e) =>
                        update(
                          "attributes",
                          draft.attributes.map((x: Row, j: number) =>
                            i === j ? { ...x, value: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove specification"
                      onClick={() =>
                        update(
                          "attributes",
                          draft.attributes.filter(
                            (_: Row, j: number) => i !== j,
                          ),
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </section>
              <section className="management-panel">
                <h3>Search engine listing</h3>
                {input("seoTitle", "SEO title", "text", { maxLength: 200 })}
                <label>
                  Meta description
                  <textarea
                    rows={3}
                    maxLength={320}
                    value={draft.seoDescription}
                    onChange={(e) => update("seoDescription", e.target.value)}
                  />
                </label>
                <div className="admin-seo-preview">
                  <small>/product/{draft.id || "new"}</small>
                  <strong>
                    {draft.seoTitle || draft.name || "Product title"}
                  </strong>
                  <p>
                    {draft.seoDescription || draft.description.slice(0, 160)}
                  </p>
                </div>
              </section>
            </div>
            <aside className="console-product-settings">
              <section className="management-panel">
                <h3>Status</h3>
                <label>
                  Product status
                  <select
                    aria-label="Product status"
                    value={draft.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <p className="console-help">
                  Only active products are shown in your store.
                </p>
              </section>
              <section className="management-panel">
                <h3>Organization</h3>
                <label>
                  Category
                  <select
                    aria-label="Category"
                    value={draft.categoryId}
                    onChange={(e) => {
                      const t = terms.find(
                        (t) => t.id === Number(e.target.value),
                      );
                      update("categoryId", e.target.value);
                      if (t) update("category", t.name);
                    }}
                  >
                    <option value="">Use current category</option>
                    {terms
                      .filter(
                        (t) =>
                          t.kind === "category" &&
                          (t.active || t.id === Number(draft.categoryId)),
                      )
                      .map((t) => (
                        <option value={t.id} key={t.id}>
                          {t.name}
                          {!t.active ? " (archived)" : ""}
                        </option>
                      ))}
                  </select>
                </label>
                {!draft.categoryId &&
                  input("category", "Category name", "text", {
                    required: true,
                    maxLength: 100,
                  })}
                <label>
                  Brand
                  <select
                    aria-label="Brand"
                    value={draft.brandId}
                    onChange={(e) => update("brandId", e.target.value)}
                  >
                    <option value="">No brand</option>
                    {terms
                      .filter(
                        (t) =>
                          t.kind === "brand" &&
                          (t.active || t.id === Number(draft.brandId)),
                      )
                      .map((t) => (
                        <option value={t.id} key={t.id}>
                          {t.name}
                          {!t.active ? " (archived)" : ""}
                        </option>
                      ))}
                  </select>
                </label>
                {input("vendor", "Vendor", "text", { maxLength: 200 })}
                <fieldset className="console-tag-picker">
                  <legend>Tags</legend>
                  {terms
                    .filter((t) => t.kind === "tag" && t.active)
                    .map((t) => (
                      <label className="console-checkbox" key={t.id}>
                        <input
                          type="checkbox"
                          checked={draft.tagIds.includes(t.id)}
                          onChange={(e) =>
                            update(
                              "tagIds",
                              e.target.checked
                                ? [...draft.tagIds, t.id]
                                : draft.tagIds.filter(
                                    (id: number) => id !== t.id,
                                  ),
                            )
                          }
                        />
                        {t.name}
                      </label>
                    ))}
                  {!terms.some((t) => t.kind === "tag") && (
                    <small>
                      Create tags in the Tags section, then assign them here.
                    </small>
                  )}
                </fieldset>
              </section>
              <section className="management-panel">
                <h3>Merchandising</h3>
                <label>
                  Product badge
                  <select
                    value={draft.badge}
                    onChange={(e) => update("badge", e.target.value)}
                  >
                    {badges.map((b) => (
                      <option key={b} value={b}>
                        {b || "No badge"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="console-checkbox">
                  <input
                    type="checkbox"
                    checked={draft.promotionActive}
                    onChange={(e) =>
                      update("promotionActive", e.target.checked)
                    }
                  />{" "}
                  Enable timed promotion
                </label>
                {input(
                  "promotionStartsAt",
                  "Promotion starts",
                  "datetime-local",
                  { required: draft.promotionActive },
                )}
                {input("promotionEndsAt", "Promotion ends", "datetime-local", {
                  required: draft.promotionActive,
                })}
                <p className="console-help">
                  Sale prices and countdown badges follow these dates. Low-stock
                  and sold-out badges follow inventory.
                </p>
              </section>
              <details className="management-panel">
                <summary>Ratings & sales display</summary>
                {input("rating", "Rating", "number", {
                  min: 0,
                  max: 5,
                  step: 0.1,
                })}
                {input("reviewCount", "Review count", "number", {
                  min: 0,
                  step: 1,
                  required: true,
                })}
                {input("soldCount", "Sold count", "number", {
                  min: 0,
                  step: 1,
                  required: true,
                })}
                <p className="console-help">
                  Enter verified data only. Leave ratings blank when there are
                  no reviews.
                </p>
              </details>
            </aside>
          </div>
          <div className="console-save-footer">
            <span>
              {dirty ? "You have unsaved changes" : "Product details are saved"}
            </span>
            <button className="console-primary" disabled={busy}>
              {busy ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

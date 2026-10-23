"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "../management.css";
type Row = Record<string, any>;
const empty = () => ({
  id: null,
  name: "",
  description: "",
  category: "Accessories",
  color: "",
  image: "",
  price_minor: 0,
  original_price_minor: null,
  stock: 0,
  active: false,
  badge: "",
  rating: null,
  review_count: 0,
  sold_count: 0,
  promotion_active: false,
  promotion_starts_at: "",
  promotion_ends_at: "",
  media: [],
  attributes: {},
});
const localDate = (v: string) =>
  v
    ? new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
export default function Admin() {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [setupCode, setSetupCode] = useState(""),
    [setupRequired, setSetupRequired] = useState(false),
    [setupAvailable, setSetupAvailable] = useState(false),
    [checking, setChecking] = useState(true),
    [identity, setIdentity] = useState<{username:string;role:string}|null>(null),
    [securityOpen, setSecurityOpen] = useState(false),
    [logged, setLogged] = useState(false),
    [products, setProducts] = useState<Row[]>([]),
    [orders, setOrders] = useState<Row[]>([]),
    [customers, setCustomers] = useState<Row[]>([]),
    [summary, setSummary] = useState<Row>({}),
    [tab, setTab] = useState("products"),
    [query, setQuery] = useState(""),
    [draft, setDraft] = useState<Row | null>(null),
    [image, setImage] = useState(""),
    [media, setMedia] = useState<Row[]>([]),
    [attributes, setAttributes] = useState<{ name: string; value: string }[]>(
      [],
    ),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(0);
  async function api(url: string, method = "GET", body?: unknown) {
    const r = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const d = await r.json();
    if (r.status === 401 && url !== "/api/admin/session") { clearDashboard(); }
    if (!r.ok) throw Error(d.error || "Request failed.");
    return d;
  }
  function clearDashboard() {
    setLogged(false);setIdentity(null);setProducts([]);setOrders([]);setCustomers([]);setSummary({});setDraft(null);setSecurityOpen(false);setImage("");setMedia([]);setAttributes([]);setQuery("");setPage(0);
  }
  useEffect(() => {
    let active=true;
    (async()=>{try{
      const data=await api("/api/admin/session");if(!active)return;
      setSetupRequired(data.setupRequired);setSetupAvailable(data.setupAvailable);setIdentity(data.user);
      if(data.user)await load(0);
    }catch(e){if(active)setError((e as Error).message)}finally{if(active)setChecking(false)}})();
    return()=>{active=false};
  },[]);
  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setBusy(true);setError("");setMessage("");
    try {
      if(setupRequired && password!==confirmPassword)throw Error("Passwords do not match.");
      const data=await api("/api/admin/session","POST",{action:setupRequired?"setup":"login",username,password,setupCode:setupRequired?setupCode:undefined});
      setIdentity(data.user);setSetupRequired(false);setPassword("");setConfirmPassword("");setSetupCode("");setLogged(true);await load(0);
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function signOut() {
    setBusy(true);setError("");try{await api("/api/admin/session","POST",{action:"logout"});clearDashboard();setMessage("You have signed out.");}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function changePassword(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();const data=new FormData(e.currentTarget);setBusy(true);setError("");
    try{
      if(data.get("newPassword")!==data.get("confirmPassword"))throw Error("Passwords do not match.");
      await api("/api/admin/session","POST",{action:"password",currentPassword:data.get("currentPassword"),newPassword:data.get("newPassword")});
      clearDashboard();setMessage("Password updated. Sign in again with your new password.");
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function load(next = page) {
    setBusy(true);
    setError("");
    try {
      const [p, o, c] = await Promise.all([
        api("/api/admin/products"),
        api("/api/admin/orders?offset=" + next * 100),
        api("/api/admin/customers?offset=" + next * 100),
      ]);
      setProducts(p.products);
      setOrders(o.orders);
      setCustomers(c.customers);
      setSummary(o.summary);
      setLogged(true);
      setPage(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(p: Row) {
    setDraft(p);
    setImage(p.image || "");
    setMedia(p.media || []);
    setAttributes(
      Object.entries(p.attributes || {}).map(([name, value]) => ({
        name,
        value: String(value),
      })),
    );
    setError("");
    setMessage("");
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      const price = Number(b.price) * 100,
        original = b.originalPrice ? Number(b.originalPrice) * 100 : null;
      const data = {
        id: draft.id,
        name: b.name,
        description: b.description,
        category: b.category,
        color: b.color,
        image,
        priceMinor: Math.round(price),
        originalPriceMinor: original === null ? null : Math.round(original),
        stock: Number(b.stock),
        active: b.active === "on",
        badge: b.badge,
        rating: b.rating === "" ? null : Number(b.rating),
        reviewCount: Number(b.reviewCount),
        soldCount: Number(b.soldCount),
        promotionActive: b.promotionActive === "on",
        promotionStartsAt: b.promotionStartsAt
          ? new Date(String(b.promotionStartsAt)).toISOString()
          : null,
        promotionEndsAt: b.promotionEndsAt
          ? new Date(String(b.promotionEndsAt)).toISOString()
          : null,
        media,
        attributes: Object.fromEntries(
          attributes
            .filter((a) => a.name.trim())
            .map((a) => [a.name.trim(), a.value]),
        ),
      };
      await api("/api/admin/products", "POST", data);
      setDraft(null);
      await load();
      setMessage("Product saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined, main: boolean) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const r = await fetch("/api/admin/media", {
          method: "POST",
          body: form,
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (main) {
        if (d.type !== "image")
          throw Error("Use an image for the main product photo.");
        setImage(d.url);
      } else {
        if (media.length >= 12)
          throw Error("A gallery supports up to 12 items.");
        setMedia((current) => [
          ...current,
          { url: d.url, type: d.type, alt: "" },
        ]);
      }
      setMessage("Uploaded. Save the product to attach the media.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function updateOrder(id: string, data: Row) {
    setError("");
    try {
      await api("/api/admin/orders", "PATCH", { id, ...data });
      await load();
      setMessage("Order updated.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const filtered = (rows: Row[]) =>
    rows.filter((p) =>
      JSON.stringify(p).toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <div className="hp management-admin">
      <main className="management-container">
        <div className="management-heading">
          <div>
            <h1>Store management</h1>
            <p>Products, inventory, orders and customers.</p>
            {identity && <p className="admin-signed-in">Signed in as <strong>{identity.username}</strong> · {identity.role}</p>}
          </div>
          <div className="admin-header-actions">
            <Link href="/">View store ↗</Link>
            {logged && <><button type="button" aria-expanded={securityOpen} onClick={()=>setSecurityOpen(!securityOpen)}>Account security</button><button type="button" onClick={signOut} disabled={busy}>Sign out</button></>}
          </div>
        </div>
        {error && (
          <p className="management-alert" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="management-message" role="status">
            {message}
          </p>
        )}
        {checking ? <p role="status">Checking secure session…</p> : !logged ? (
          <section className="management-panel account-login admin-sign-in">
            <span className="admin-login-mark" aria-hidden="true">BE</span>
            <h2>{setupRequired ? "Create your admin account" : "Admin sign in"}</h2>
            <p>{setupRequired ? "Set up the first store owner account using your private setup code." : "Sign in to manage your store."}</p>
            {setupRequired && !setupAvailable && <p className="management-alert">Add ADMIN_SETUP_TOKEN in Hostinger, then restart the app to enable initial setup.</p>}
            <form className="management-form" onSubmit={signIn}>
              {setupRequired && <label>Setup code<input type="password" required minLength={32} maxLength={256} autoComplete="off" value={setupCode} onChange={e=>setSetupCode(e.target.value)} /></label>}
              <label>Username<input type="text" required minLength={3} maxLength={64} pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,63}" autoCapitalize="none" autoCorrect="off" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} /></label>
              <label>Password<input type="password" required minLength={setupRequired ? 12 : undefined} maxLength={128} autoComplete={setupRequired ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} /></label>
              {setupRequired && <label>Confirm password<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /></label>}
              <button className="commerce-primary" disabled={busy || (setupRequired && !setupAvailable)}>{busy ? "Please wait…" : setupRequired ? "Create admin account" : "Sign in"}</button>
            </form>
          </section>
        ) : (
          <>
            {securityOpen && <section className="management-panel admin-security-panel"><h2>Change password</h2><p>Changing your password signs out all admin sessions for this account.</p>
              <form className="management-form" onSubmit={changePassword}>
                <label>Current password<input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" /></label>
                <label>New password<input name="newPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
                <label>Confirm new password<input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
                <button className="commerce-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
              </form>
            </section>}
            <div className="management-stats">
              <div>
                <small>Total orders</small>
                <strong>{summary.total || 0}</strong>
              </div>
              <div>
                <small>Orders today</small>
                <strong>{summary.today || 0}</strong>
              </div>
              <div>
                <small>Pending fulfillment</small>
                <strong>{summary.pending || 0}</strong>
              </div>
              <div>
                <small>Low-stock products</small>
                <strong>
                  {products.filter((p) => p.active && p.stock <= 3).length}
                </strong>
              </div>
            </div>
            <div className="management-toolbar">
              <div className="management-tabs">
                {["products", "orders", "customers"].map((t) => (
                  <button
                    key={t}
                    aria-pressed={tab === t}
                    onClick={() => {
                      setTab(t);
                      setQuery("");
                      setDraft(null);
                    }}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <label className="management-search">
                Search
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the loaded records"
                />
              </label>
              <button disabled={busy} onClick={() => load()}>
                Refresh
              </button>
            </div>
            {tab === "products" && (
              <>
                <div className="management-heading">
                  <h2>
                    Inventory <small>({products.length})</small>
                  </h2>
                  <button
                    className="commerce-primary"
                    onClick={() => edit(empty())}
                  >
                    Add product
                  </button>
                </div>
                {draft ? (
                  <section className="management-panel">
                    <div className="management-heading">
                      <h2>
                        {draft.id ? "Edit product #" + draft.id : "New product"}
                      </h2>
                      <button onClick={() => setDraft(null)}>
                        Close editor
                      </button>
                    </div>
                    <form
                      key={draft.id || "new"}
                      className="management-form"
                      onSubmit={save}
                    >
                      <div className="management-fields">
                        <label>
                          Product title
                          <input
                            name="name"
                            required
                            maxLength={200}
                            defaultValue={draft.name}
                          />
                        </label>
                        <label>
                          Category
                          <input
                            name="category"
                            required
                            maxLength={100}
                            defaultValue={draft.category}
                            list="product-categories"
                          />
                          <datalist id="product-categories">
                            {[
                              "Home & Living",
                              "Fashion",
                              "Tech",
                              "Beauty",
                              "Accessories",
                              "Grocery",
                              "Sports & Fitness",
                              "Watches",
                              "Footwear",
                            ].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </datalist>
                        </label>
                      </div>
                      <label>
                        Description
                        <textarea
                          name="description"
                          rows={5}
                          maxLength={10000}
                          defaultValue={draft.description}
                        />
                      </label>
                      <div className="management-fields">
                        <label>
                          Current / sale price
                          <input
                            name="price"
                            type="number"
                            step=".01"
                            min=".01"
                            required
                            defaultValue={draft.price_minor / 100}
                          />
                        </label>
                        <label>
                          Original price{" "}
                          <small>Leave blank when not on sale</small>
                          <input
                            name="originalPrice"
                            type="number"
                            step=".01"
                            min=".01"
                            defaultValue={
                              draft.original_price_minor
                                ? draft.original_price_minor / 100
                                : ""
                            }
                          />
                        </label>
                        <label>
                          Stock quantity
                          <input
                            name="stock"
                            type="number"
                            min={0}
                            step={1}
                            required
                            defaultValue={draft.stock}
                          />
                        </label>
                        <label>
                          Color / finish
                          <input
                            name="color"
                            maxLength={100}
                            defaultValue={draft.color}
                          />
                        </label>
                        <label>
                          Badge
                          <input
                            name="badge"
                            maxLength={24}
                            defaultValue={draft.badge}
                            list="product-badges"
                          />
                          <datalist id="product-badges">
                            {[
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
                            ].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </datalist>
                        </label>
                        <p className="management-muted">One badge appears on the product image. Countdown Timer, Flash Sale, Lightning Deal, Ends Soon and Early Bird Price require an enabled promotion with start/end dates. Few Left requires 1–3 units; Sold Out appears automatically at zero stock. Leave Badge blank to hide it.</p>
                        <label>
                          Rating
                          <input
                            name="rating"
                            type="number"
                            min={0}
                            max={5}
                            step=".1"
                            defaultValue={draft.rating ?? ""}
                          />
                        </label>
                        <label>
                          Review count
                          <input
                            name="reviewCount"
                            type="number"
                            min={0}
                            step={1}
                            required
                            defaultValue={draft.review_count || 0}
                          />
                        </label>
                        <label>
                          Sold count
                          <input
                            name="soldCount"
                            type="number"
                            min={0}
                            step={1}
                            required
                            defaultValue={draft.sold_count || 0}
                          />
                        </label>
                      </div>
                      <label className="management-check">
                        <input
                          name="active"
                          type="checkbox"
                          defaultChecked={draft.active}
                        />
                        Published in the store
                      </label>
                      <fieldset>
                        <legend>Images & videos</legend>
                        <label>
                          Main image URL
                          <input
                            required
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            maxLength={2000}
                          />
                        </label>
                        <label>
                          Upload main image
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            disabled={busy}
                            onChange={(e) => upload(e.target.files?.[0], true)}
                          />
                        </label>
                        {image.startsWith("/") ||
                        image.startsWith("https://") ? (
                          <img
                            className="management-product-preview"
                            src={image}
                            alt="Main product preview"
                          />
                        ) : null}
                        <label>
                          Upload gallery image or video
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,video/mp4"
                            disabled={busy}
                            onChange={(e) => upload(e.target.files?.[0], false)}
                          />
                        </label>
                        <p className="management-muted">
                          Up to 20 MB per upload. Gallery items support image or
                          video, URL and image description. Remove an item from
                          the list to detach it.
                        </p>
                        <div className="management-media-items">
                          {media.map((m, i) => (
                            <div className="management-media-item" key={i}>
                              <label>
                                Media type
                                <select
                                  value={m.type}
                                  onChange={(e) =>
                                    setMedia((rows) =>
                                      rows.map((row, j) =>
                                        j === i
                                          ? { ...row, type: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                >
                                  <option value="image">Image</option>
                                  <option value="video">Video</option>
                                </select>
                              </label>
                              <label>
                                Media URL
                                <input
                                  value={m.url}
                                  required
                                  maxLength={2000}
                                  onChange={(e) =>
                                    setMedia((rows) =>
                                      rows.map((row, j) =>
                                        j === i
                                          ? { ...row, url: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <label>
                                Description
                                <input
                                  value={m.alt}
                                  maxLength={200}
                                  onChange={(e) =>
                                    setMedia((rows) =>
                                      rows.map((row, j) =>
                                        j === i
                                          ? { ...row, alt: e.target.value }
                                          : row,
                                      ),
                                    )
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setMedia((rows) =>
                                    rows.filter((_, j) => j !== i),
                                  )
                                }
                              >
                                Remove media
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={media.length >= 12}
                          onClick={() =>
                            setMedia((rows) => [
                              ...rows,
                              { type: "image", url: "", alt: "" },
                            ])
                          }
                        >
                          Add media URL
                        </button>
                      </fieldset>
                      <fieldset>
                        <legend>Promotion</legend>
                        <label className="management-check">
                          <input
                            name="promotionActive"
                            type="checkbox"
                            defaultChecked={draft.promotion_active}
                          />
                          Enable scheduled promotion
                        </label>
                        <div className="management-fields">
                          <label>
                            Starts
                            <input
                              name="promotionStartsAt"
                              type="datetime-local"
                              defaultValue={localDate(
                                draft.promotion_starts_at,
                              )}
                            />
                          </label>
                          <label>
                            Ends
                            <input
                              name="promotionEndsAt"
                              type="datetime-local"
                              defaultValue={localDate(draft.promotion_ends_at)}
                            />
                          </label>
                        </div>
                      </fieldset>
                      <fieldset>
                        <legend>Specifications</legend>
                        <p className="management-muted">
                          Add details such as SKU, dimensions, material, sizes
                          and care instructions.
                        </p>
                        {attributes.map((a, i) => (
                          <div className="management-fields" key={i}>
                            <label>
                              Attribute
                              <input
                                value={a.name}
                                maxLength={100}
                                onChange={(e) =>
                                  setAttributes((rows) =>
                                    rows.map((r, j) =>
                                      j === i
                                        ? { ...r, name: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                              />
                            </label>
                            <label>
                              Value
                              <input
                                value={a.value}
                                maxLength={1000}
                                onChange={(e) =>
                                  setAttributes((rows) =>
                                    rows.map((r, j) =>
                                      j === i
                                        ? { ...r, value: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setAttributes((rows) =>
                                  rows.filter((_, j) => j !== i),
                                )
                              }
                            >
                              Remove attribute
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setAttributes((rows) => [
                              ...rows,
                              { name: "", value: "" },
                            ])
                          }
                        >
                          Add attribute
                        </button>
                      </fieldset>
                      <button className="commerce-primary" disabled={busy}>
                        {busy ? "Saving…" : "Save product"}
                      </button>
                    </form>
                  </section>
                ) : (
                  <div className="management-table-wrap">
                    <table className="management-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(products).map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.name}</strong>
                              <small>#{p.id}</small>
                            </td>
                            <td>{p.category}</td>
                            <td>
                              {p.currency} {p.price_minor / 100}
                            </td>
                            <td>{p.stock}</td>
                            <td>
                              {p.active ? "Published" : "Archived / draft"}
                            </td>
                            <td>
                              <button onClick={() => edit(p)}>Edit</button>
                              {p.active && (
                                <button
                                  disabled={busy}
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        "Remove this product from the shop? Past orders will be retained.",
                                      )
                                    )
                                      return;
                                    try {
                                      await api(
                                        "/api/admin/products",
                                        "DELETE",
                                        { id: p.id },
                                      );
                                      await load();
                                      setMessage("Product archived.");
                                    } catch (e) {
                                      setError((e as Error).message);
                                    }
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!products.length && (
                      <p>No products yet. Add your first product.</p>
                    )}
                  </div>
                )}
              </>
            )}
            {tab === "orders" && (
              <section className="management-panel">
                <h2>Orders</h2>
                {filtered(orders).map((o) => (
                  <article key={o.id} className="account-order">
                    <div className="management-heading">
                      <h3>{o.id.slice(0, 8)}</h3>
                      <span className="management-status">
                        {o.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p>
                      {new Date(o.created_at).toLocaleString()} · {o.currency}{" "}
                      {o.total_minor / 100} · {o.payment_method}
                    </p>
                    <details>
                      <summary>Customer & order details</summary>
                      <dl className="management-details">
                        {Object.entries(o.customer || {}).map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{String(v || "—")}</dd>
                          </div>
                        ))}
                      </dl>
                      <ul>
                        {o.items?.map((i: Row, j: number) => (
                          <li key={j}>
                            {i.name} × {i.quantity} — {o.currency}{" "}
                            {(i.price_minor * i.quantity) / 100}
                          </li>
                        ))}
                      </ul>
                      <form
                        className="management-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const data = Object.fromEntries(
                            new FormData(e.currentTarget),
                          );
                          updateOrder(o.id, data);
                        }}
                      >
                        <label>
                          Tracking number
                          <input
                            name="trackingNumber"
                            maxLength={100}
                            defaultValue={o.tracking_number}
                          />
                        </label>
                        <label>
                          Tracking URL
                          <input
                            name="trackingUrl"
                            type="url"
                            defaultValue={o.tracking_url}
                          />
                        </label>
                        <button>Save tracking</button>
                      </form>
                    </details>
                    {["confirmed", "paid", "processing", "shipped"].includes(
                      o.status,
                    ) && (
                      <button
                        className="commerce-primary"
                        onClick={() =>
                          updateOrder(o.id, {
                            status: ["confirmed", "paid"].includes(o.status)
                              ? "processing"
                              : o.status === "processing"
                                ? "shipped"
                                : "delivered",
                          })
                        }
                      >
                        {["confirmed", "paid"].includes(o.status)
                          ? "Start processing"
                          : o.status === "processing"
                            ? "Mark shipped"
                            : "Mark delivered"}
                      </button>
                    )}
                  </article>
                ))}
                {!orders.length && <p>No orders yet.</p>}
              </section>
            )}
            {tab === "customers" && (
              <section className="management-panel">
                <h2>Customer accounts</h2>
                {filtered(customers).map((c) => (
                  <details className="account-order" key={c.id}>
                    <summary>
                      {c.name} · {c.email} · {c.order_count} orders
                    </summary>
                    <dl className="management-details">
                      {Object.entries(c).map(([k, v]) => (
                        <div key={k}>
                          <dt>{k.replaceAll("_", " ")}</dt>
                          <dd>{String(v ?? "—")}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ))}
                {!customers.length && (
                  <p>
                    No customer accounts yet. Guest delivery details appear with
                    their orders.
                  </p>
                )}
              </section>
            )}
            {tab !== "products" && (
              <div className="management-heading">
                <button
                  disabled={busy || page === 0}
                  onClick={() => load(page - 1)}
                >
                  Previous 100
                </button>
                <span>Page {page + 1}</span>
                <button
                  disabled={
                    busy || (tab === "orders" ? orders : customers).length < 100
                  }
                  onClick={() => load(page + 1)}
                >
                  Next 100
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}


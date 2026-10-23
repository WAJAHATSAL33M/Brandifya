"use client";
import { useEffect, useState } from "react";
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  BookOpen,
  Warehouse,
} from "lucide-react";
import type { AdminApi, Row } from "./workspace-utils";
import { date, money, downloadCsv } from "./workspace-utils";
export default function Operations({
  tab,
  api,
  onRefresh,
  onNavigate,
}: {
  tab: string;
  api: AdminApi;
  onRefresh: () => Promise<void>;
  onNavigate: (tab: string) => void;
}) {
  const [data, setData] = useState<{ products: Row[]; movements: Row[] }>({
      products: [],
      movements: [],
    }),
    [purchases, setPurchases] = useState<Row[]>([]),
    [summary, setSummary] = useState<Row>({}),
    [revenue, setRevenue] = useState<Row[]>([]),
    [daily, setDaily] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [stock, setStock] = useState("all"),
    [selected, setSelected] = useState<Row | null>(null),
    [lines, setLines] = useState<Row[]>([
      { productId: "", quantity: 1, cost: 0 },
    ]);
  async function load() {
    setError("");
    setBusy(true);
    try {
      const results = await Promise.allSettled([
        api("/api/admin/inventory"),
        api("/api/admin/purchases"),
        api("/api/admin/orders"),
      ]);
      const [i, p, o] = results;
      if (i.status === "fulfilled") setData(i.value);
      if (p.status === "fulfilled") setPurchases(p.value.purchases);
      if (o.status === "fulfilled") {
        setSummary(o.value.summary);
        setRevenue(o.value.revenue || []);
        setDaily(o.value.daily || []);
      }
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length)
        setError(
          failed
            .map((r) => (r as PromiseRejectedResult).reason.message)
            .join(" "),
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void load();
  }, [tab]);
  async function mutate(url: string, body: Row) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(url, "POST", body);
      await load();
      await onRefresh();
      setMessage("Changes saved.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const low = data.products.filter(
      (p) => p.active && p.stock > 0 && p.stock <= p.reorder_level,
    ),
    out = data.products.filter((p) => p.active && p.stock === 0),
    units = data.products.reduce((s, p) => s + p.stock, 0),
    value = data.products.reduce((s, p) => s + p.stock * p.cost_minor, 0);
  const filtered = data.products.filter(
    (p) =>
      `${p.name} ${p.sku || ""} ${p.category} ${p.supplier || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (stock === "all" ||
        (stock === "low" && p.stock > 0 && p.stock <= p.reorder_level) ||
        (stock === "out" && p.stock === 0) ||
        (stock === "healthy" && p.stock > p.reorder_level)),
  );
  return (
    <section className="admin-module">
      {busy && (
        <p className="console-subtle-status" role="status">
          Refreshing workspace data…
        </p>
      )}
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
      {tab === "overview" ? (
        <>
          <div className="admin-welcome">
            <div>
              <span className="admin-kicker">YOUR STORE AT A GLANCE</span>
              <h2>
                Your operations, in focus.
                <br />
              </h2>
              <p>A clear view of your orders, stock and next steps.</p>
              <button
                className="commerce-primary"
                onClick={() => onNavigate("orders")}
              >
                Manage orders <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="admin-welcome-mark">
              <Warehouse size={78} />
              <span>
                Brand E<br />
                <small>Store operations</small>
              </span>
            </div>
          </div>
          <div className="admin-metric-grid">
            {[
              [ShoppingCart, "Total orders", summary.total || 0],
              [PackageCheck, "Needs fulfilment", summary.pending || 0],
              [Boxes, "Units on hand", units],
              [AlertTriangle, "Needs restocking", low.length + out.length],
            ].map(([Icon, label, v]) => {
              const C = Icon as typeof Boxes;
              return (
                <div className="admin-metric" key={String(label)}>
                  <C size={20} />
                  <small>{String(label)}</small>
                  <strong>{String(v)}</strong>
                </div>
              );
            })}
          </div>
          <section className="management-panel console-orders-chart">
            <div className="console-card-title">
              <h3>Order activity</h3>
              <small>Last 14 days · All order statuses</small>
            </div>
            <div className="console-chart-total">
              <strong>{daily.reduce((n, d) => n + Number(d.count), 0)}</strong>
              <span>orders placed</span>
            </div>
            <div
              className="console-chart-bars"
              role="img"
              aria-label={
                "Orders in the last 14 days: " +
                daily.reduce((n, d) => n + Number(d.count), 0)
              }
            >
              {Array.from({ length: 14 }, (_, i) => {
                const day = new Date();
                day.setUTCDate(day.getUTCDate() - 13 + i);
                const key = day.toISOString().slice(0, 10),
                  record = daily.find(
                    (d) => new Date(d.day).toISOString().slice(0, 10) === key,
                  ),
                  count = Number(record?.count || 0),
                  max = Math.max(1, ...daily.map((d) => Number(d.count)));
                return (
                  <div key={key} title={key + ": " + count + " orders"}>
                    <span
                      style={{ height: Math.max(2, (count / max) * 95) + "%" }}
                    />
                    <small>
                      {day.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </small>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="admin-two-column">
            <section className="management-panel">
              <div className="management-heading">
                <h3>Stock that needs attention</h3>
                <button onClick={() => onNavigate("inventory")}>
                  View inventory →
                </button>
              </div>
              {[...out, ...low].slice(0, 7).map((p) => (
                <div className="admin-list-item" key={p.id}>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.sku || "#" + p.id} · {p.category}
                    </small>
                  </span>
                  <span className={"admin-pill " + (p.stock ? "low" : "out")}>
                    {p.stock ? `${p.stock} left` : "Out of stock"}
                  </span>
                </div>
              ))}
              {!low.length && !out.length && (
                <p className="admin-empty">
                  Your published products have healthy stock.
                </p>
              )}
            </section>
            <section className="management-panel">
              <h3>Store totals</h3>
              <dl className="admin-totals">
                <div>
                  <dt>Inventory cost value</dt>
                  <dd>{money(value)}</dd>
                </div>
                <div>
                  <dt>Open purchase orders</dt>
                  <dd>
                    {purchases.filter((p) => p.status === "ordered").length}
                  </dd>
                </div>
                <div>
                  <dt>Orders placed today</dt>
                  <dd>{summary.today || 0}</dd>
                </div>
                {revenue.map((r) => (
                  <div key={r.currency}>
                    <dt>Delivered order value ({r.currency})</dt>
                    <dd>{money(r.delivered_minor, r.currency)}</dd>
                  </div>
                ))}
              </dl>
              <p className="management-muted">
                Inventory value uses saved unit costs. Delivered value is not a
                payment reconciliation report.
              </p>
              <button onClick={() => onNavigate("blogs")}>
                <BookOpen size={16} /> Write a journal article
              </button>
            </section>
          </div>
          <section className="management-panel">
            <h3>Recent stock activity</h3>
            {data.movements.slice(0, 5).map((m) => (
              <div className="admin-list-item" key={m.id}>
                <span>
                  <strong>{m.name}</strong>
                  <small>
                    {m.reason} · {m.actor} · {date(m.created_at)}
                  </small>
                </span>
                <strong
                  className={m.delta > 0 ? "admin-positive" : "admin-negative"}
                >
                  {m.delta > 0 ? "+" : ""}
                  {m.delta}
                </strong>
              </div>
            ))}
            {!data.movements.length && <p>No stock movements recorded yet.</p>}
          </section>
        </>
      ) : null}
      {tab === "inventory" ? (
        <>
          <div className="management-heading">
            <div>
              <h2>Inventory</h2>
              <p>Know what’s available, where it is and when to reorder.</p>
            </div>
            <button
              onClick={() =>
                downloadCsv(
                  "brande-inventory.csv",
                  filtered.map((p) => ({
                    ID: p.id,
                    Product: p.name,
                    SKU: p.sku,
                    Stock: p.stock,
                    Reorder: p.reorder_level,
                    Supplier: p.supplier,
                    Location: p.location,
                    UnitCost: p.cost_minor / 100,
                    Status: p.active ? "Published" : "Draft",
                  })),
                )
              }
            >
              Export inventory
            </button>
          </div>
          <div className="admin-metric-grid compact">
            <div className="admin-metric">
              <small>All products</small>
              <strong>{data.products.length}</strong>
            </div>
            <div className="admin-metric">
              <small>Low stock</small>
              <strong>{low.length}</strong>
            </div>
            <div className="admin-metric">
              <small>Published, out of stock</small>
              <strong>{out.length}</strong>
            </div>
            <div className="admin-metric">
              <small>Inventory cost value</small>
              <strong>{money(value)}</strong>
            </div>
          </div>
          <div className="admin-filter-row">
            <label>
              Find inventory
              <input
                placeholder="Search product, SKU, supplier or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Stock status
              <select value={stock} onChange={(e) => setStock(e.target.value)}>
                <option value="all">All stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
                <option value="healthy">Healthy stock</option>
              </select>
            </label>
            <button disabled={busy} onClick={load}>
              Refresh
            </button>
          </div>
          {selected && (
            <section className="management-panel">
              <div className="management-heading">
                <h3>{selected.name}</h3>
                <button onClick={() => setSelected(null)}>Close</button>
              </div>
              <div className="admin-two-column">
                <form
                  className="management-form"
                  key={"details" + selected.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = Object.fromEntries(new FormData(e.currentTarget));
                    await mutate("/api/admin/inventory", {
                      action: "details",
                      id: selected.id,
                      ...f,
                      costMinor: Math.round(Number(f.cost) * 100),
                      reorderLevel: Number(f.reorderLevel),
                    });
                  }}
                >
                  <h4>Inventory details</h4>
                  <div className="management-fields">
                    <label>
                      SKU
                      <input
                        name="sku"
                        maxLength={100}
                        defaultValue={selected.sku || ""}
                      />
                    </label>
                    <label>
                      Supplier
                      <input
                        name="supplier"
                        maxLength={200}
                        defaultValue={selected.supplier || ""}
                      />
                    </label>
                    <label>
                      Storage location
                      <input
                        name="location"
                        maxLength={120}
                        defaultValue={selected.location || ""}
                      />
                    </label>
                    <label>
                      Unit cost
                      <input
                        name="cost"
                        type="number"
                        min={0}
                        step=".01"
                        required
                        defaultValue={selected.cost_minor / 100}
                      />
                    </label>
                    <label>
                      Reorder threshold
                      <input
                        name="reorderLevel"
                        type="number"
                        min={0}
                        step={1}
                        max={1000000}
                        required
                        defaultValue={selected.reorder_level}
                      />
                    </label>
                  </div>
                  <button className="commerce-primary" disabled={busy}>
                    Save inventory details
                  </button>
                </form>
                <form
                  className="management-form"
                  key={"adjust" + selected.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      f = Object.fromEntries(new FormData(form));
                    if (
                      await mutate("/api/admin/inventory", {
                        action: "adjust",
                        id: selected.id,
                        delta: Number(f.delta),
                        reason: f.reason,
                        reference: f.reference,
                      })
                    ) {
                      form.reset();
                      setSelected(null);
                    }
                  }}
                >
                  <h4>Adjust stock</h4>
                  <p>
                    Add a positive quantity to receive stock, or a negative
                    quantity for damage, loss or corrections.
                  </p>
                  <label>
                    Quantity change
                    <input
                      name="delta"
                      type="number"
                      step={1}
                      min={-1000000}
                      max={1000000}
                      required
                      placeholder="e.g. 10 or -2"
                    />
                  </label>
                  <label>
                    Reason
                    <input
                      name="reason"
                      maxLength={300}
                      required
                      placeholder="Why is stock changing?"
                    />
                  </label>
                  <label>
                    Reference (optional)
                    <input name="reference" maxLength={100} />
                  </label>
                  <button disabled={busy}>Record stock adjustment</button>
                </form>
              </div>
            </section>
          )}
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Available</th>
                  <th>Reorder at</th>
                  <th>Location / supplier</th>
                  <th>Unit cost</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <small>
                        {p.sku || "#" + p.id} ·{" "}
                        {p.active ? "Published" : "Draft / archived"}
                      </small>
                    </td>
                    <td>
                      <span
                        className={
                          "admin-pill " +
                          (p.stock === 0
                            ? "out"
                            : p.stock <= p.reorder_level
                              ? "low"
                              : "healthy")
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td>{p.reorder_level}</td>
                    <td>
                      {p.location || "—"}
                      <small>{p.supplier || "No supplier"}</small>
                    </td>
                    <td>{money(p.cost_minor, p.currency)}</td>
                    <td>
                      <button onClick={() => setSelected(p)}>
                        Manage stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <p className="admin-empty">No products match these filters.</p>
            )}
          </div>
          <section className="management-panel">
            <div className="management-heading">
              <h3>Stock movement history</h3>
              <button
                onClick={() =>
                  downloadCsv("brande-stock-movements.csv", data.movements)
                }
              >
                Export latest 200
              </button>
            </div>
            <div className="management-table-wrap">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Change</th>
                    <th>Balance</th>
                    <th>Reason / reference</th>
                    <th>Recorded by</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.movements.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </td>
                      <td>{m.stock_after}</td>
                      <td>
                        {m.reason}
                        <small>{m.reference}</small>
                      </td>
                      <td>{m.actor}</td>
                      <td>{date(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small>
              Showing the latest 200 stock movements. Older history remains
              stored in the database.
            </small>
          </section>
        </>
      ) : null}
      {tab === "purchases" ? (
        <>
          <div className="management-heading">
            <div>
              <h2>Purchasing</h2>
              <p>Plan replenishment and receive incoming inventory.</p>
            </div>
            <button
              onClick={() =>
                downloadCsv(
                  "brande-purchases.csv",
                  purchases.map((p) => ({
                    Reference: p.id,
                    Supplier: p.supplier,
                    Status: p.status,
                    Expected: p.expected_at,
                    Created: p.created_at,
                  })),
                )
              }
            >
              Export latest 200
            </button>
          </div>
          <section className="management-panel">
            <h3>Create purchase order</h3>
            <form
              className="management-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  f = Object.fromEntries(new FormData(form));
                if (
                  await mutate("/api/admin/purchases", {
                    action: "create",
                    ...f,
                    items: lines.map((l) => ({
                      productId: Number(l.productId),
                      quantity: Number(l.quantity),
                      costMinor: Math.round(Number(l.cost) * 100),
                    })),
                  })
                ) {
                  form.reset();
                  setLines([{ productId: "", quantity: 1, cost: 0 }]);
                }
              }}
            >
              <div className="management-fields">
                <label>
                  Supplier
                  <input
                    name="supplier"
                    required
                    maxLength={200}
                    list="inventory-suppliers"
                  />
                </label>
                <label>
                  Expected arrival
                  <input name="expectedAt" type="date" />
                </label>
              </div>
              <datalist id="inventory-suppliers">
                {Array.from(
                  new Set(data.products.map((p) => p.supplier).filter(Boolean)),
                ).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </datalist>
              {lines.map((l, i) => (
                <div className="admin-purchase-line" key={i}>
                  <label>
                    Product
                    <select
                      required
                      value={l.productId}
                      onChange={(e) =>
                        setLines((xs) =>
                          xs.map((x, j) =>
                            i === j ? { ...x, productId: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      <option value="">Choose a product</option>
                      {data.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Quantity
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      step={1}
                      required
                      value={l.quantity}
                      onChange={(e) =>
                        setLines((xs) =>
                          xs.map((x, j) =>
                            i === j ? { ...x, quantity: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Unit cost
                    <input
                      type="number"
                      min={0}
                      step=".01"
                      required
                      value={l.cost}
                      onChange={(e) =>
                        setLines((xs) =>
                          xs.map((x, j) =>
                            i === j ? { ...x, cost: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((xs) => xs.filter((_, j) => i !== j))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={lines.length >= 100}
                onClick={() =>
                  setLines((xs) => [
                    ...xs,
                    { productId: "", quantity: 1, cost: 0 },
                  ])
                }
              >
                + Add product
              </button>
              <label>
                Internal notes
                <textarea name="notes" maxLength={3000} rows={2} />
              </label>
              <strong>
                Expected cost:{" "}
                {money(
                  lines.reduce(
                    (s, l) =>
                      s + Number(l.quantity) * Math.round(Number(l.cost) * 100),
                    0,
                  ),
                )}
              </strong>
              <button className="commerce-primary" disabled={busy}>
                Create purchase order
              </button>
            </form>
          </section>
          <section className="management-panel">
            <h3>Purchase orders</h3>
            {purchases.map((p) => (
              <details className="admin-purchase" key={p.id}>
                <summary>
                  <span>
                    <strong>{p.supplier}</strong>
                    <small>
                      PO-{p.id.slice(0, 8)} · Expected{" "}
                      {p.expected_at
                        ? new Date(p.expected_at).toLocaleDateString()
                        : "not set"}
                    </small>
                  </span>
                  <span className={"admin-pill " + p.status}>{p.status}</span>
                </summary>
                <p>{p.notes}</p>
                {p.items.map((i: Row) => (
                  <div className="admin-list-item" key={i.product_id}>
                    <span>{i.name}</span>
                    <span>
                      {i.quantity} × {money(i.cost_minor)}
                    </span>
                  </div>
                ))}
                {p.status === "ordered" && (
                  <div className="admin-inline-actions">
                    <button
                      className="commerce-primary"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            "Receive all items and add quantities to stock?",
                          )
                        )
                          void mutate("/api/admin/purchases", {
                            action: "receive",
                            id: p.id,
                          });
                      }}
                    >
                      Receive all stock
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Cancel this purchase order?"))
                          void mutate("/api/admin/purchases", {
                            action: "cancel",
                            id: p.id,
                          });
                      }}
                    >
                      Cancel purchase
                    </button>
                  </div>
                )}
              </details>
            ))}
            {!purchases.length && (
              <p className="admin-empty">No purchase orders yet.</p>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

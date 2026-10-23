"use client";
import { useEffect, useState } from "react";
import type { AdminApi, Row } from "./workspace-utils";
import { money, date, downloadCsv } from "./workspace-utils";
export default function OrderWorkspace({ api }: { api: AdminApi }) {
  const [orders, setOrders] = useState<Row[]>([]),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(0),
    [total, setTotal] = useState(0),
    [detail, setDetail] = useState<Row | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    const id = setTimeout(() => {
      setBusy(true);
      setError("");
      const params = new URLSearchParams({
        q,
        status,
        offset: String(page * 100),
      });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      api("/api/admin/orders?" + params)
        .then((d) => {
          if (active) {
            setOrders(d.orders);
            setTotal(d.total);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [q, status, from, to, page, message]);
  async function open(id: string) {
    setBusy(true);
    setError("");
    try {
      setDetail(await api("/api/admin/orders?id=" + id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function update(body: Row) {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/orders", "PATCH", {
        id: detail!.order.id,
        ...body,
      });
      await open(detail!.order.id);
      setMessage("Order updated " + new Date().toLocaleTimeString());
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const o = detail?.order;
  return (
    <section className="admin-module">
      <div className="management-heading">
        <div>
          <h2>Orders</h2>
          <p>From a new order to a delivered parcel.</p>
        </div>
        <button
          disabled={!orders.length}
          onClick={() =>
            downloadCsv(
              "brande-orders-page-" + (page + 1) + ".csv",
              orders.map((o) => ({
                Order: o.id,
                Date: o.created_at,
                Customer: o.customer.name,
                Phone: o.customer.phone,
                Status: o.status,
                Payment: o.payment_method,
                Currency: o.currency,
                Total: o.total_minor / 100,
                Tracking: o.tracking_number,
              })),
            )
          }
        >
          Export current results
        </button>
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
      <div className="admin-filter-row">
        <label>
          Find an order
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Order, customer, phone or tracking"
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All statuses</option>
            {[
              "awaiting_payment",
              "confirmed",
              "paid",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      {busy && <p role="status">Loading order data…</p>}
      {o && (
        <section className="management-panel admin-order-detail">
          <div className="management-heading">
            <div>
              <small>ORDER DETAILS</small>
              <h3>#{o.id.slice(0, 8)}</h3>
              <span className={"admin-pill " + o.status}>
                {o.status.replaceAll("_", " ")}
              </span>
            </div>
            <div className="admin-inline-actions">
              <button onClick={() => window.print()}>
                Print order / packing slip
              </button>
              <button onClick={() => setDetail(null)}>Close details</button>
            </div>
          </div>
          <div className="admin-two-column">
            <div>
              <h4>Delivery address</h4>
              <p>
                <strong>{o.customer.name}</strong>
                <br />
                {o.customer.address}
                <br />
                {o.customer.city} {o.customer.postalCode}
                <br />
                {o.customer.country}
              </p>
              <a href={"tel:" + o.customer.phone}>{o.customer.phone}</a>
              {o.customer.email && (
                <p>
                  <a href={"mailto:" + o.customer.email}>{o.customer.email}</a>
                </p>
              )}
              {o.customer.alternatePhone && (
                <p>Alternate: {o.customer.alternatePhone}</p>
              )}
            </div>
            <dl className="admin-totals">
              <div>
                <dt>Placed</dt>
                <dd>{date(o.created_at)}</dd>
              </div>
              <div>
                <dt>Payment method</dt>
                <dd>
                  {o.payment_method === "cod" ? "Cash on delivery" : "Stripe"}
                </dd>
              </div>
              <div>
                <dt>Tracking</dt>
                <dd>{o.tracking_number || "Not assigned"}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{money(o.shipping_minor, o.currency)}</dd>
              </div>
              <div>
                <dt>Order total</dt>
                <dd>{money(o.total_minor, o.currency)}</dd>
              </div>
            </dl>
          </div>
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((i: Row) => (
                  <tr key={i.product_id}>
                    <td>
                      {i.name}
                      <small>#{i.product_id}</small>
                    </td>
                    <td>{i.quantity}</td>
                    <td>{money(i.price_minor, o.currency)}</td>
                    <td>{money(i.price_minor * i.quantity, o.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-order-controls">
            <div className="admin-inline-actions">
              {["confirmed", "paid", "processing", "shipped"].includes(
                o.status,
              ) && (
                <button
                  className="commerce-primary"
                  disabled={busy}
                  onClick={() =>
                    update({
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
              {o.payment_method === "cod" &&
                ["confirmed", "processing"].includes(o.status) && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm("Cancel this order and restore its stock?"))
                        void update({ status: "cancelled" });
                    }}
                  >
                    Cancel & restore stock
                  </button>
                )}
            </div>
            <div className="admin-two-column">
              <form
                className="management-form"
                key={o.id + o.tracking_number}
                onSubmit={(e) => {
                  e.preventDefault();
                  void update(
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                }}
              >
                <h4>Shipment tracking</h4>
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
                <button disabled={busy}>Save tracking</button>
              </form>
              <form
                className="management-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  if (await update({ note: new FormData(f).get("note") }))
                    f.reset();
                }}
              >
                <h4>Internal order note</h4>
                <label>
                  Note
                  <textarea
                    name="note"
                    required
                    maxLength={3000}
                    rows={4}
                    placeholder="Visible only to store admins"
                  />
                </label>
                <button disabled={busy}>Add note</button>
              </form>
            </div>
            <div className="admin-two-column">
              <div>
                <h4>Status history</h4>
                <ol className="admin-timeline">
                  <li>{date(o.created_at)} · Order placed</li>
                  {detail.events.map((e: Row) => (
                    <li key={e.id}>
                      {date(e.created_at)} · {e.status.replaceAll("_", " ")}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h4>Staff notes</h4>
                {detail.notes.map((n: Row) => (
                  <div className="admin-note" key={n.id}>
                    <p>{n.note}</p>
                    <small>
                      {n.actor} · {date(n.created_at)}
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <p className="management-muted">
              Changing order status does not issue a payment refund. Process
              card refunds through your payment provider.
            </p>
          </div>
        </section>
      )}
      <div className="management-table-wrap">
        <table className="management-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>#{o.id.slice(0, 8)}</strong>
                  <small>{date(o.created_at)}</small>
                </td>
                <td>
                  {o.customer.name}
                  <small>{o.customer.phone}</small>
                </td>
                <td>
                  <span className={"admin-pill " + o.status}>
                    {o.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td>{money(o.total_minor, o.currency)}</td>
                <td>{o.payment_method.toUpperCase()}</td>
                <td>
                  <button disabled={busy} onClick={() => open(o.id)}>
                    View order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && !busy && (
          <p className="admin-empty">No orders match your filters.</p>
        )}
      </div>
      <div className="admin-pagination">
        <button
          disabled={busy || page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>
          {total} matching orders · Page {page + 1}
        </span>
        <button
          disabled={busy || (page + 1) * 100 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

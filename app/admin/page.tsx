"use client";
import { useState } from "react";
export default function Admin() {
  const [token, setToken] = useState(""),
    [orders, setOrders] = useState<Record<string, unknown>[]>([]),
    [error, setError] = useState(""),
    [logged, setLogged] = useState(false);
  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setOrders(data.orders);
      setLogged(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function update(id: unknown, status: string) {
    const r = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });
    if (!r.ok) {
      const data = await r.json();
      setError(data.error);
      return;
    }
    await load();
  }
  return (
    <main className="checkout">
      <a className="text-link" href="/">
        Back to store
      </a>
      <h1>Order management</h1>
      <p>
        Merchant access. Your token is held in memory and is cleared when this
        page closes.
      </p>
      {!logged ? (
        <form onSubmit={load}>
          <label>
            Admin access token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <button className="primary">View orders</button>
        </form>
      ) : (
        <>
          <button className="text-link" onClick={() => load()}>
            Refresh orders
          </button>
          <button
            className="text-link"
            onClick={() => {
              setToken("");
              setOrders([]);
              setLogged(false);
            }}
            style={{ marginLeft: 20 }}
          >
            Sign out
          </button>
          {!orders.length && <p>No orders yet.</p>}
          {orders.map((o) => (
            <section className="admin-order" key={String(o.id)}>
              <h3>{String(o.id)}</h3>
              <p>
                {String(o.status)} · {String(o.payment_method)} ·{" "}
                {String(o.currency)} {Number(o.total_minor) / 100}
              </p>
              <p>{JSON.stringify(o.customer)}</p>
              {o.status === "paid" || o.status === "confirmed" ? (
                <button
                  className="primary"
                  onClick={() => update(o.id, "processing")}
                >
                  Start processing
                </button>
              ) : o.status === "processing" ? (
                <button
                  className="primary"
                  onClick={() => update(o.id, "shipped")}
                >
                  Mark shipped
                </button>
              ) : o.status === "shipped" ? (
                <button
                  className="primary"
                  onClick={() => update(o.id, "delivered")}
                >
                  Mark delivered
                </button>
              ) : null}
            </section>
          ))}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}

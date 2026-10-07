"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import {
  products,
  sanitizeCart,
  money,
  subtotal,
  type Product,
  type CartItem,
} from "../../lib/catalog";
type Config = {
  live: boolean;
  cod: boolean;
  stripe: boolean;
  country: string;
  currency: string;
  shippingMinor: number;
};
export default function Checkout() {
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]),
    [config, setConfig] = useState<Config | null>(null),
    [method, setMethod] = useState("cod"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    try {
      setCart(
        sanitizeCart(
          JSON.parse(localStorage.getItem("brandifya-cart") || "[]"),
        ),
      );
    } catch {}
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        setCatalog(data.products);
        setCart((c) => sanitizeCart(c, data.products));
      })
      .catch(() => setError("Inventory could not be loaded. Please refresh."));
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((c) => {
        setConfig(c);
        setMethod(c.cod ? "cod" : "stripe");
      })
      .catch(() =>
        setError("Store configuration could not be loaded. Please refresh."),
      );
    if (new URLSearchParams(location.search).has("cancelled"))
      setError(
        "Payment was cancelled. No confirmed payment has been recorded. Your bag is saved.",
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget),
      customer = Object.fromEntries(form.entries());
    customer.country = config?.country || "PK";
    const fingerprint = JSON.stringify({ cart, customer, method });
    let requestKey = "";
    try {
      const previous = JSON.parse(
        sessionStorage.getItem("brandifya-checkout") || "null",
      );
      requestKey =
        previous?.fingerprint === fingerprint
          ? previous.key
          : crypto.randomUUID();
      sessionStorage.setItem(
        "brandifya-checkout",
        JSON.stringify({ fingerprint, key: requestKey }),
      );
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, customer, method, requestKey }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Checkout could not be completed.");
      if (result.url) {
        location.assign(result.url);
      } else {
        localStorage.setItem(
          "brandifya-last-order",
          JSON.stringify({ id: result.orderId, status: result.status }),
        );
        localStorage.removeItem("brandifya-cart");
        sessionStorage.removeItem("brandifya-checkout");
        location.assign("/order");
      }
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main className="checkout">
      <a className="text-link" href="/">
        <ArrowLeft size={16} /> Back to store
      </a>
      <h1 style={{ fontSize: 30, marginTop: 20 }}>Checkout</h1>
      <p>Your delivery and payment details.</p>
      {config && !config.live && (
        <p className="error" role="status">
          Store setup is in progress. Orders and payments are disabled until the
          merchant configures and verifies the store.
        </p>
      )}
      <div className="checkout-grid">
        <form onSubmit={submit}>
          <h2>Delivery details</h2>
          <label>
            Full name
            <input name="name" required maxLength={120} autoComplete="name" />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              type="tel"
              required
              maxLength={30}
              autoComplete="tel"
            />
          </label>
          <label>
            Street address
            <input
              name="address"
              required
              maxLength={300}
              autoComplete="street-address"
            />
          </label>
          <label>
            City
            <input
              name="city"
              required
              maxLength={120}
              autoComplete="address-level2"
            />
          </label>
          <label>
            Postal code
            <input
              name="postalCode"
              required
              maxLength={20}
              autoComplete="postal-code"
            />
          </label>
          <p>Delivery country: {config?.country || "Loading…"}</p>
          <h3 style={{ marginTop: 25 }}>Payment method</h3>
          <label className="radio">
            <input
              type="radio"
              name="payment"
              checked={method === "cod"}
              onChange={() => setMethod("cod")}
              disabled={!config?.cod}
            />
            Cash on delivery {!config?.cod && "(unavailable)"}
          </label>
          <label className="radio">
            <input
              type="radio"
              name="payment"
              checked={method === "stripe"}
              onChange={() => setMethod("stripe")}
              disabled={!config?.stripe}
            />
            Card via Stripe {!config?.stripe && "(unavailable)"}
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button
            className="primary"
            disabled={
              busy ||
              !config?.live ||
              !cart.length ||
              !(method === "cod" ? config.cod : config.stripe)
            }
            type="submit"
          >
            {busy
              ? "Processing…"
              : method === "stripe"
                ? "Continue to secure payment"
                : "Place cash-on-delivery order"}
            <ArrowRight size={16} />
          </button>
          <p style={{ marginTop: 15 }}>
            <ShieldCheck size={14} /> Card details are entered only on Stripe’s
            secure checkout.
          </p>
        </form>
        <aside className="order-summary">
          <h2>Your order</h2>
          {cart.length ? (
            cart.map((i) => {
              const p = catalog.find((p) => p.id === i.id)!;
              return (
                <div key={i.id}>
                  <span>
                    {p.name} × {i.quantity}
                  </span>
                  <strong>{money(p.price * i.quantity)}</strong>
                </div>
              );
            })
          ) : (
            <p>
              Your bag is empty. <a href="/">Explore the store.</a>
            </p>
          )}
          <div>
            <span>Products</span>
            <b>{money(subtotal(cart, catalog))}</b>
          </div>
          <div>
            <span>Shipping</span>
            <b>
              {config?.live
                ? money(config.shippingMinor / 100)
                : "Not configured"}
            </b>
          </div>
          <div>
            <span>Estimated total</span>
            <b>
              {money(
                subtotal(cart, catalog) + (config?.shippingMinor || 0) / 100,
              )}
            </b>
          </div>
          <p style={{ marginTop: 15 }}>
            Final price and inventory are verified by the server. Sample catalog
            values must be replaced with approved products before launch.
          </p>
        </aside>
      </div>
    </main>
  );
}

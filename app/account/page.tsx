"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SupportFrame from "../support-frame";
import "../management.css";
type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  emailVerified: boolean;
};
type Order = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  currency: string;
  total_minor: number;
  tracking_number: string;
  tracking_url: string;
  customer: Record<string, string>;
  items: { name: string; quantity: number; price_minor: number }[];
  events: { status: string; created_at: string }[];
};
export default function Account() {
  const [user, setUser] = useState<Profile | null>(null),
    [providers, setProviders] = useState({
      email: false,
      google: false,
      facebook: false,
    }),
    [loading, setLoading] = useState(true),
    [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [orders, setOrders] = useState<Order[]>([]),
    [total, setTotal] = useState(0),
    [offset, setOffset] = useState(0),
    [recentOrder, setRecentOrder] = useState<{
      id: string;
      key: string;
    } | null>(null);
  useEffect(() => {
    if (user && !loading && window.location.hash === "#orders") {
      document.getElementById("orders")?.scrollIntoView({ block: "start" });
    }
  }, [user, loading]);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/account", { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setUser(d.user);
      setProviders(d.providers);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    try {
      const recent = JSON.parse(
        localStorage.getItem("brandifya-last-order") || "null",
      );
      if (typeof recent?.id === "string" && typeof recent?.key === "string")
        setRecentOrder(recent);
    } catch {}
    if (new URLSearchParams(location.search).has("error"))
      setError(
        "Social sign-in could not be completed. Try again, or use your existing sign-in method.",
      );
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/account/orders?offset=" + offset, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) {
          setOrders(d.orders);
          setTotal(d.total);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [user, offset]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch("/api/account", {
        method: user ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user ? b : { ...b, action: mode }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.user) {
        setUser(d.user);
        window.dispatchEvent(new Event("brande-account"));
      }
      setMessage(d.message || "Signed in.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (!r.ok) throw Error("Sign out failed.");
      setUser(null);
      window.dispatchEvent(new Event("brande-account"));
      setOrders([]);
      setMessage("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SupportFrame>
      <header className="support-hero">
        <h1>{user ? "Your account" : "Welcome to Brande"}</h1>
        <p>
          {user
            ? "Your orders, delivery details and profile in one place."
            : "Sign in or create an account to follow your orders and manage your details."}
        </p>
      </header>
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
      {loading ? (
        <p role="status">Loading your account…</p>
      ) : !user ? (
        <section className="account-login management-panel">
          <div className="management-tabs" aria-label="Account options">
            <button
              type="button"
              aria-pressed={mode === "login"}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={mode === "signup"}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
          </div>
          <h2>
            {mode === "signup"
              ? "Create your account"
              : mode === "reset"
                ? "Reset your password"
                : mode === "resend"
                  ? "Confirm your email"
                  : "Sign in"}
          </h2>
          <form onSubmit={submit} className="management-form">
            {mode === "signup" && (
              <label>
                Full name
                <input
                  name="name"
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </label>
            )}
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
            {["login", "signup"].includes(mode) && (
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={mode === "signup" ? 12 : undefined}
                  maxLength={128}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
                {mode === "signup" && (
                  <small>
                    Use at least 12 characters. We’ll email a confirmation link.
                  </small>
                )}
              </label>
            )}
            <button
              className="commerce-primary"
              disabled={
                busy ||
                (["signup", "reset", "resend"].includes(mode) &&
                  !providers.email)
              }
            >
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : mode === "resend"
                      ? "Send confirmation link"
                      : "Sign in"}
            </button>
          </form>
          <div className="account-help">
            <button onClick={() => setMode("reset")}>Forgot password?</button>
            <button onClick={() => setMode("resend")}>
              Resend confirmation
            </button>
          </div>
          {!providers.email && (
            <p className="management-muted">
              Email registration and password recovery are not available yet.
            </p>
          )}
          <div className="account-social">
            <a
              href={providers.google ? "/api/account/oauth/google" : undefined}
              aria-disabled={!providers.google}
            >
              Continue with Google
              {!providers.google && <small>Available soon</small>}
            </a>
            <a
              href={
                providers.facebook ? "/api/account/oauth/facebook" : undefined
              }
              aria-disabled={!providers.facebook}
            >
              Continue with Facebook
              {!providers.facebook && <small>Available soon</small>}
            </a>
          </div>
          <p className="management-muted">
            By creating an account, you agree to our{" "}
            <Link href="/terms-and-conditions">Terms</Link> and acknowledge our{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </section>
      ) : (
        <div className="account-layout">
          <section className="management-panel">
            <div className="management-heading">
              <h2>Your profile</h2>
              <button onClick={logout} disabled={busy}>
                Sign out
              </button>
            </div>
            <form
              key={user.email}
              onSubmit={submit}
              className="management-form"
            >
              <label>
                Full name
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={user.name}
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  defaultValue={user.email}
                  autoComplete="email"
                />
              </label>
              <label>
                Current password{" "}
                <small>For email changes on password accounts</small>
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  maxLength={30}
                  defaultValue={user.phone}
                  autoComplete="tel"
                />
              </label>
              <label>
                Address
                <textarea
                  name="address"
                  maxLength={300}
                  defaultValue={user.address}
                  autoComplete="street-address"
                />
              </label>
              <div className="management-fields">
                <label>
                  City
                  <input name="city" maxLength={120} defaultValue={user.city} />
                </label>
                <label>
                  Postal code
                  <input
                    name="postalCode"
                    maxLength={20}
                    defaultValue={user.postalCode}
                  />
                </label>
              </div>
              <label>
                Country code
                <input
                  name="country"
                  maxLength={2}
                  defaultValue={user.country}
                  placeholder="PK"
                />
              </label>
              <button className="commerce-primary" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </button>
            </form>
            <p className="management-muted">
              Profile updates apply to future checkouts. Existing orders retain
              their original delivery details.
            </p>
          </section>
          <section className="management-panel" id="orders" style={{ scrollMarginTop: 96 }}>
            <h2>
              Your orders <small>({total})</small>
            </h2>
            {recentOrder && !orders.some((o) => o.id === recentOrder.id) && (
              <div className="management-message">
                <p>
                  Have a recent guest order in this browser? Link order{" "}
                  {recentOrder.id.slice(0, 8)} to your account using its saved
                  confirmation.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const r = await fetch("/api/account/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(recentOrder),
                      });
                      const d = await r.json();
                      if (!r.ok) throw Error(d.error);
                      setRecentOrder(null);
                      await load();
                      setOffset(0);
                      setMessage("Guest order linked to your account.");
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Link recent guest order
                </button>
              </div>
            )}
            {!orders.length && (
              <p>
                No orders linked to this account yet. Sign in before placing a
                new order to see it here.
              </p>
            )}
            {orders.map((o) => (
              <article className="account-order" key={o.id}>
                <div className="management-heading">
                  <h3>Order {o.id.slice(0, 8)}</h3>
                  <span className="management-status">
                    {o.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p>
                  <time dateTime={o.created_at}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </time>{" "}
                  ·{" "}
                  {new Intl.NumberFormat("en-PK", {
                    style: "currency",
                    currency: o.currency,
                  }).format(o.total_minor / 100)}
                </p>
                <details>
                  <summary>View order details</summary>
                  <ul>
                    {o.items.map((i, j) => (
                      <li key={j}>
                        {i.name} × {i.quantity} —{" "}
                        {new Intl.NumberFormat("en-PK", {
                          style: "currency",
                          currency: o.currency,
                        }).format((i.price_minor * i.quantity) / 100)}
                      </li>
                    ))}
                  </ul>
                  <p>
                    {o.customer.name}
                    <br />
                    {o.customer.address}, {o.customer.city}
                    <br />
                    {o.customer.phone}
                  </p>
                  <p>Updated {new Date(o.updated_at).toLocaleString()}</p>
                  {o.events.map((event, j) => (
                    <p key={j}>
                      {event.status} ·{" "}
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  ))}
                  {o.tracking_number && <p>Tracking: {o.tracking_number}</p>}
                  {o.tracking_url && (
                    <a
                      href={o.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track delivery ↗
                    </a>
                  )}
                </details>
              </article>
            ))}
            <div className="management-heading">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 20))}
              >
                Previous
              </button>
              <button
                disabled={offset + 20 >= total}
                onClick={() => setOffset(offset + 20)}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      )}
    </SupportFrame>
  );
}

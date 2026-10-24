"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import OrderProgress from "../order-tracking/order-progress";
import SupportFrame from "../support-frame";
import "./account.css";
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
type Mode = "login" | "signup" | "reset" | "resend";
const labels: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  paid: "Payment received",
  processing: "Preparing your order",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const money = (n: number, currency: string) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency }).format(
    n / 100,
  );
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function AppleMark() {
  return (
    <svg
      width="20"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.1 12.5c0-2 1.6-3 1.7-3.1-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.6 0-3 .9-3.8 2.2-1.6 2.7-.4 6.7 1.1 8.9.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7 1.2 0 2-1 2.7-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.3-3.8ZM14.8 6.3c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2-.5 2.7-1.3Z" />
    </svg>
  );
}
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.5-.1-2.9-.4-4.3H24v8.2h11c-.5 2.6-1.9 4.8-4.1 6.3v5.2h6.6c3.8-3.6 6.1-8.9 6.1-15.4Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.2c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.4A20.4 20.4 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.4a12 12 0 0 1 0-7.6v-5.4H5.8a20.1 20.1 0 0 0 0 18.4l6.8-5.4Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.4c3 0 5.6 1 7.7 3l5.8-5.7A19.7 19.7 0 0 0 24 3.2 20.4 20.4 0 0 0 5.8 14.4l6.8 5.4C14.2 15 18.7 11.4 24 11.4Z"
      />
    </svg>
  );
}
export default function Account() {
  const [user, setUser] = useState<Profile | null>(null),
    [providers, setProviders] = useState({
      email: false,
      google: false,
      apple: false,
      facebook: false,
    }),
    [loading, setLoading] = useState(true),
    [mode, setMode] = useState<Mode>("login"),
    [view, setView] = useState("overview"),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [sent, setSent] = useState(false),
    [email, setEmail] = useState(""),
    [orders, setOrders] = useState<Order[]>([]),
    [ordersLoading, setOrdersLoading] = useState(false),
    [ordersError, setOrdersError] = useState(""),
    [total, setTotal] = useState(0),
    [summary, setSummary] = useState({ active: 0, delivered: 0 }),
    [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0),
    [recentOrder, setRecentOrder] = useState<{
      id: string;
      key: string;
    } | null>(null);
  const feedback = useRef<HTMLDivElement>(null);
  async function api(url: string, method = "GET", body?: unknown) {
    const r = await fetch(url, {
      method,
      cache: "no-store",
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    let d;
    try {
      d = await r.json();
    } catch {
      throw Error("We couldn’t reach the account service. Please try again.");
    }
    if (!r.ok)
      throw Error(d.error || "Something went wrong. Please try again.");
    return d;
  }
  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/account");
      setUser(d.user);
      setProviders({
        email: false,
        google: false,
        apple: false,
        facebook: false,
        ...d.providers,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    try {
      const r = JSON.parse(
        localStorage.getItem("brandifya-last-order") || "null",
      );
      if (typeof r?.id === "string" && typeof r?.key === "string")
        setRecentOrder(r);
    } catch {}
    if (location.hash === "#orders") setView("orders");
    if (new URLSearchParams(location.search).has("error"))
      setError(
        "Social sign-in was not completed. Try again or sign in with email. If you already use email, use that sign-in method.",
      );
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setOrdersLoading(true);
    setOrdersError("");
    api("/api/account/orders?offset=" + offset)
      .then((d) => {
        if (active) {
          setOrders(d.orders);
          setTotal(d.total);
          setSummary(d.summary || { active: 0, delivered: 0 });
        }
      })
      .catch((e) => {
        if (active) setOrdersError(e.message);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, offset, refresh]);
  useEffect(() => {
    if (error || message) feedback.current?.focus();
  }, [error, message]);
  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setSent(false);
    setShowPassword(false);
  }
  function navigate(next: string) {
    setView(next);
    setError("");
    setMessage("");
    if (next !== "profile") setOffset(0);
    history.replaceState(
      null,
      "",
      "/account" + (next === "overview" ? "" : "#" + next),
    );
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      const d = await api(
        "/api/account",
        user ? "PATCH" : "POST",
        user ? b : { ...b, action: mode },
      );
      if (d.user) {
        setUser(d.user);
        window.dispatchEvent(new Event("brande-account"));
      } else if (!user) setSent(true);
      setMessage(d.message || "Welcome back. You’re signed in.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await api("/api/account", "POST", { action: "logout" });
      setUser(null);
      setOrders([]);
      setTotal(0);
      setOffset(0);
      setView("overview");
      setMessage("");
      setError("");
      switchMode("login");
      window.dispatchEvent(new Event("brande-account"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function claim() {
    if (!recentOrder) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/account/orders", "POST", recentOrder);
      setRecentOrder(null);
      setOffset(0);
      setRefresh((n) => n + 1);
      setMessage("Your guest order is now linked to your account.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const authTitle =
    mode === "signup"
      ? "Create your account"
      : mode === "reset"
        ? "Forgot your password?"
        : mode === "resend"
          ? "Verify your email"
          : "Welcome back";
  const unavailable =
    ["signup", "reset", "resend"].includes(mode) && !providers.email;
  return (
    <SupportFrame>
      <div className="customer-area">
        <div ref={feedback} tabIndex={-1} className="customer-feedback">
          {error && (
            <p className="customer-alert" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="customer-success" role="status">
              {message}
            </p>
          )}
        </div>
        {loading ? (
          <div className="customer-loading" role="status">
            <RefreshCw className="customer-spin" /> Loading your account…
          </div>
        ) : !user ? (
          <div className="customer-auth-layout">
            <aside className="customer-welcome">
              <span className="customer-brand">
                Brand E <span>YOUR EVERYDAY, UPGRADED.</span>
              </span>
              <div>
                <span className="customer-symbol">
                  <ShoppingBag size={36} />
                </span>
                <h1>
                  A little more
                  <br />
                  you. All in one place.
                </h1>
                <p>
                  Your next find, your delivery updates, your own space at Brand
                  E.
                </p>
              </div>
              <ul>
                <li>
                  <Package />
                  <span>
                    <strong>Every order, together</strong>
                    <small>See your purchases and order details.</small>
                  </span>
                </li>
                <li>
                  <Truck />
                  <span>
                    <strong>Follow your delivery</strong>
                    <small>Stay updated from confirmation to arrival.</small>
                  </span>
                </li>
                <li>
                  <ShieldCheck />
                  <span>
                    <strong>Your details, in your control</strong>
                    <small>Manage your profile and delivery address.</small>
                  </span>
                </li>
              </ul>
              <Link href="/shop">
                Explore the store <ArrowRight size={17} />
              </Link>
            </aside>
            <section
              className="customer-auth-card"
              aria-labelledby="auth-title"
            >
              <Link href="/" className="customer-back">
                <ArrowLeft size={15} /> Back to store
              </Link>
              <div className="customer-auth-tabs" aria-label="Account options">
                <button
                  disabled={busy}
                  aria-pressed={mode === "login"}
                  onClick={() => switchMode("login")}
                >
                  Sign in
                </button>
                <button
                  disabled={busy}
                  aria-pressed={mode === "signup"}
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </div>
              <h2 id="auth-title">{sent ? "Check your inbox" : authTitle}</h2>
              <p className="customer-intro">
                {sent
                  ? "Your next step is in your email. Check your spam folder too."
                  : mode === "signup"
                    ? "A few details, then you’re one step closer to your next find."
                    : mode === "reset"
                      ? "Enter your email and we’ll send a secure reset link."
                      : mode === "resend"
                        ? "Request a fresh confirmation link for your account."
                        : "Sign in to follow your orders and pick up where you left off."}
              </p>
              {sent ? (
                <div className="customer-inbox">
                  <Mail size={36} />
                  <strong>{email}</strong>
                  <p>
                    Links expire after 30 minutes. Once your email is confirmed,
                    return here to sign in.
                  </p>
                  <button
                    className="customer-primary"
                    onClick={() => switchMode("login")}
                  >
                    Return to sign in <ArrowRight size={17} />
                  </button>
                  {mode !== "reset" && (
                    <button
                      className="customer-text"
                      onClick={() => switchMode("resend")}
                    >
                      Need another confirmation link?
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {["login", "signup"].includes(mode) && (
                    <>
                      <div className="customer-social">
                        {providers.google ? (
                          <a href="/api/account/oauth/google">
                            <GoogleMark /> Continue with Google
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            aria-describedby="social-unavailable"
                          >
                            <GoogleMark /> Continue with Google
                          </button>
                        )}
                        {providers.apple ? (
                          <a
                            className="customer-apple"
                            href="/api/account/oauth/apple"
                          >
                            <AppleMark /> Continue with Apple
                          </a>
                        ) : (
                          <button
                            className="customer-apple"
                            type="button"
                            disabled
                            aria-describedby="social-unavailable"
                          >
                            <AppleMark /> Continue with Apple
                          </button>
                        )}
                        {providers.facebook && (
                          <a href="/api/account/oauth/facebook">
                            <span
                              className="customer-facebook"
                              aria-hidden="true"
                            >
                              f
                            </span>{" "}
                            Continue with Facebook
                          </a>
                        )}
                      </div>
                      {(!providers.google || !providers.apple) && (
                        <p
                          className="customer-social-note"
                          id="social-unavailable"
                        >
                          {!providers.google && !providers.apple
                            ? "Google and Apple sign-in are"
                            : !providers.google
                              ? "Google sign-in is"
                              : "Apple sign-in is"}{" "}
                          temporarily unavailable. Choose another available
                          option, or shop as a guest.
                        </p>
                      )}
                      <div className="customer-divider">
                        <span>or continue with email</span>
                      </div>
                    </>
                  )}
                  {unavailable && (
                    <div className="customer-note" role="status">
                      {mode === "signup"
                        ? "Account registration is temporarily unavailable."
                        : "Account emails are temporarily unavailable."}{" "}
                      You can still shop and check out as a guest.{" "}
                      <Link href="/contact">Contact us for help</Link>.
                    </div>
                  )}
                  <form
                    key={mode}
                    onSubmit={submit}
                    className="customer-form"
                    aria-busy={busy}
                  >
                    {mode === "signup" && (
                      <label htmlFor="customer-name">
                        Full name
                        <input
                          id="customer-name"
                          name="name"
                          required
                          maxLength={120}
                          autoComplete="name"
                          placeholder="Your full name"
                          disabled={busy}
                        />
                      </label>
                    )}
                    <label htmlFor="customer-email">
                      Email address
                      <input
                        id="customer-email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={busy}
                      />
                    </label>
                    {["login", "signup"].includes(mode) && (
                      <label htmlFor="customer-password">
                        <span className="customer-label-row">
                          Password
                          {mode === "login" && (
                            <button
                              type="button"
                              className="customer-text"
                              disabled={busy}
                              onClick={() => switchMode("reset")}
                            >
                              Forgot password?
                            </button>
                          )}
                        </span>
                        <span className="customer-password">
                          <input
                            id="customer-password"
                            aria-label="Password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={mode === "signup" ? 12 : undefined}
                            maxLength={128}
                            autoComplete={
                              mode === "signup"
                                ? "new-password"
                                : "current-password"
                            }
                            aria-describedby={
                              mode === "signup" ? "password-help" : undefined
                            }
                            disabled={busy}
                          />
                          <button
                            type="button"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff size={19} />
                            ) : (
                              <Eye size={19} />
                            )}
                          </button>
                        </span>
                        {mode === "signup" && (
                          <small id="password-help">
                            Use 12 or more characters. A memorable phrase works
                            well.
                          </small>
                        )}
                      </label>
                    )}
                    {mode === "signup" && (
                      <p className="customer-terms">
                        By creating an account, you agree to our{" "}
                        <Link href="/terms-and-conditions">Terms</Link> and
                        acknowledge our{" "}
                        <Link href="/privacy-policy">Privacy Policy</Link>.
                        We’ll email you a verification link.
                      </p>
                    )}
                    <button
                      className="customer-primary"
                      disabled={busy || unavailable}
                    >
                      {busy ? (
                        <>
                          <RefreshCw size={17} className="customer-spin" />{" "}
                          Please wait…
                        </>
                      ) : (
                        <>
                          {mode === "signup"
                            ? "Create account"
                            : mode === "reset"
                              ? "Send reset link"
                              : mode === "resend"
                                ? "Send confirmation link"
                                : "Sign in"}
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </form>
                  <div className="customer-auth-help">
                    {mode === "login" ? (
                      <>
                        <span>Still waiting for your verification email?</span>
                        <button
                          className="customer-text"
                          onClick={() => switchMode("resend")}
                        >
                          Resend confirmation
                        </button>
                      </>
                    ) : (
                      <button
                        className="customer-text"
                        onClick={() => switchMode("login")}
                      >
                        <ArrowLeft size={14} /> Back to sign in
                      </button>
                    )}
                  </div>
                </>
              )}
              <div className="customer-auth-footer">
                <ShieldCheck size={15} /> Your account details stay private.
              </div>
            </section>
          </div>
        ) : (
          <>
            <header className="customer-dashboard-heading">
              <div>
                <p>Your Brand E account</p>
                <h1>Hello, {user.name.split(" ")[0]}.</h1>
                <span>Good to see you. Here’s everything you need.</span>
              </div>
              <Link className="customer-secondary" href="/shop">
                Continue shopping <ArrowRight size={17} />
              </Link>
            </header>
            <div className="customer-dashboard">
              <aside className="customer-sidebar">
                <div className="customer-identity">
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                </div>
                <nav aria-label="Account navigation">
                  {[
                    {
                      id: "overview",
                      label: "Overview",
                      icon: LayoutDashboard,
                    },
                    { id: "orders", label: "Orders & tracking", icon: Package },
                    {
                      id: "profile",
                      label: "Profile & address",
                      icon: UserRound,
                    },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      aria-current={view === id ? "page" : undefined}
                      onClick={() => navigate(id)}
                    >
                      <Icon size={19} />
                      {label}
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </nav>
                <Link href="/contact">
                  <LifeBuoy size={18} /> Need a hand?
                </Link>
                <button onClick={logout} disabled={busy}>
                  <LogOut size={18} /> Sign out
                </button>
              </aside>
              <div className="customer-dashboard-body">
                {view !== "profile" ? (
                  <>
                    {view === "overview" && (
                      <div className="customer-stats">
                        <article>
                          <Package />
                          <span>Total orders</span>
                          <strong>{ordersLoading ? "—" : total}</strong>
                        </article>
                        <article>
                          <Truck />
                          <span>In progress</span>
                          <strong>
                            {ordersLoading ? "—" : summary.active}
                          </strong>
                        </article>
                        <article>
                          <Check />
                          <span>Delivered</span>
                          <strong>
                            {ordersLoading ? "—" : summary.delivered}
                          </strong>
                        </article>
                      </div>
                    )}
                    <section className="customer-panel" id="orders">
                      <div className="customer-section-heading">
                        <div>
                          <h2>
                            {view === "overview"
                              ? "Recent orders"
                              : "Orders & tracking"}
                          </h2>
                          <p>Follow your order from our store to your door.</p>
                        </div>
                        <button
                          className="customer-icon-button"
                          aria-label="Refresh orders"
                          disabled={ordersLoading}
                          onClick={() => setRefresh((n) => n + 1)}
                        >
                          <RefreshCw
                            size={18}
                            className={ordersLoading ? "customer-spin" : ""}
                          />
                        </button>
                      </div>
                      {recentOrder &&
                        !orders.some((o) => o.id === recentOrder.id) && (
                          <div className="customer-claim">
                            <Package size={22} />
                            <div>
                              <strong>Ordered as a guest?</strong>
                              <p>
                                Link the recent order saved in this browser to
                                see it here.
                              </p>
                            </div>
                            <button
                              className="customer-secondary"
                              disabled={busy}
                              onClick={claim}
                            >
                              Link order
                            </button>
                          </div>
                        )}
                      {ordersError ? (
                        <div className="customer-alert" role="alert">
                          {ordersError}{" "}
                          <button
                            className="customer-text"
                            onClick={() => setRefresh((n) => n + 1)}
                          >
                            Try again
                          </button>
                        </div>
                      ) : ordersLoading ? (
                        <p className="customer-loading" role="status">
                          Loading your orders…
                        </p>
                      ) : !orders.length ? (
                        <div className="customer-empty">
                          <ShoppingBag size={40} />
                          <h3>Your next find is waiting</h3>
                          <p>
                            Orders placed while signed in will appear here with
                            delivery updates.
                          </p>
                          <Link className="customer-primary" href="/shop">
                            Explore products <ArrowRight size={17} />
                          </Link>
                        </div>
                      ) : (
                        orders.map((o) => (
                          <article className="customer-order" key={o.id}>
                            <div className="customer-order-top">
                              <div>
                                <h3>Order #{o.id.slice(0, 8).toUpperCase()}</h3>
                                <time dateTime={o.created_at}>
                                  Placed {date(o.created_at)}
                                </time>
                              </div>
                              <span
                                className={
                                  "customer-order-status status-" + o.status
                                }
                              >
                                {labels[o.status] || o.status}
                              </span>
                            </div>
                            <OrderProgress status={o.status} />
                            <div className="customer-order-bottom">
                              <Link
                                className="customer-secondary"
                                href={
                                  "/order-tracking?order=" +
                                  encodeURIComponent(o.id) +
                                  "&account=1"
                                }
                              >
                                Track order <ArrowRight size={15} />
                              </Link>
                              <span>
                                {o.items.reduce((n, i) => n + i.quantity, 0)}{" "}
                                items <b>{money(o.total_minor, o.currency)}</b>
                              </span>
                              {o.tracking_url && (
                                <a
                                  className="customer-secondary"
                                  href={o.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Truck size={16} /> Track delivery
                                </a>
                              )}
                            </div>
                            <details>
                              <summary>
                                Order details <ChevronRight size={15} />
                              </summary>
                              <ul className="customer-items">
                                {o.items.map((i, j) => (
                                  <li key={j}>
                                    <span>
                                      {i.name}
                                      <small>Quantity: {i.quantity}</small>
                                    </span>
                                    <strong>
                                      {money(
                                        i.price_minor * i.quantity,
                                        o.currency,
                                      )}
                                    </strong>
                                  </li>
                                ))}
                              </ul>
                              <div className="customer-order-detail-grid">
                                <div>
                                  <h4>
                                    <MapPin size={15} /> Delivery address
                                  </h4>
                                  <p>
                                    {o.customer.name}
                                    <br />
                                    {o.customer.address}, {o.customer.city}
                                    <br />
                                    {o.customer.phone}
                                  </p>
                                </div>
                                <div>
                                  <h4>
                                    <Truck size={15} /> Delivery updates
                                  </h4>
                                  {o.tracking_number && (
                                    <p>
                                      Tracking number:{" "}
                                      <strong>{o.tracking_number}</strong>
                                    </p>
                                  )}
                                  <ol className="customer-events">
                                    {o.events.map((event, j) => (
                                      <li key={j}>
                                        <strong>
                                          {labels[event.status] || event.status}
                                        </strong>
                                        <time dateTime={event.created_at}>
                                          {date(event.created_at)} ·{" "}
                                          {new Date(
                                            event.created_at,
                                          ).toLocaleTimeString("en-PK", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </time>
                                      </li>
                                    ))}
                                  </ol>
                                  {!o.events.length && (
                                    <p>No additional updates yet.</p>
                                  )}
                                </div>
                              </div>
                              <p className="customer-updated">
                                Last updated {date(o.updated_at)}.{" "}
                                <Link href="/contact">
                                  Need help with this order?
                                </Link>
                              </p>
                            </details>
                          </article>
                        ))
                      )}
                      {total > 20 && (
                        <div className="customer-pagination">
                          <button
                            className="customer-secondary"
                            disabled={ordersLoading || offset === 0}
                            onClick={() => setOffset(Math.max(0, offset - 20))}
                          >
                            Previous
                          </button>
                          <span>
                            {offset + 1}–{Math.min(offset + 20, total)} of{" "}
                            {total}
                          </span>
                          <button
                            className="customer-secondary"
                            disabled={ordersLoading || offset + 20 >= total}
                            onClick={() => setOffset(offset + 20)}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </section>
                    {view === "overview" && (
                      <div className="customer-shortcuts">
                        <button onClick={() => navigate("profile")}>
                          <MapPin />
                          <span>
                            <strong>Your delivery details</strong>
                            <small>
                              Keep your address and phone up to date.
                            </small>
                          </span>
                          <ChevronRight />
                        </button>
                        <Link href="/contact">
                          <LifeBuoy />
                          <span>
                            <strong>We’re here to help</strong>
                            <small>
                              Questions about an order? Talk to our team.
                            </small>
                          </span>
                          <ChevronRight />
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <section className="customer-panel">
                    <div className="customer-section-heading">
                      <div>
                        <h2>Profile & delivery address</h2>
                        <p>Keep your details ready for your next order.</p>
                      </div>
                      <UserRound size={24} />
                    </div>
                    <form
                      key={user.email}
                      onSubmit={submit}
                      className="customer-form customer-profile-form"
                      aria-busy={busy}
                    >
                      <div className="customer-field-grid">
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
                          Phone number
                          <input
                            name="phone"
                            type="tel"
                            maxLength={30}
                            defaultValue={user.phone}
                            autoComplete="tel"
                          />
                        </label>
                      </div>
                      <label>
                        Email address
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
                        <small>
                          Only needed when changing the email on a password
                          account.
                        </small>
                        <input
                          name="currentPassword"
                          type="password"
                          autoComplete="current-password"
                        />
                      </label>
                      <label>
                        Street address
                        <textarea
                          name="address"
                          maxLength={300}
                          defaultValue={user.address}
                          autoComplete="street-address"
                          rows={2}
                        />
                      </label>
                      <div className="customer-field-grid">
                        <label>
                          City
                          <input
                            name="city"
                            maxLength={120}
                            defaultValue={user.city}
                            autoComplete="address-level2"
                          />
                        </label>
                        <label>
                          Postal code
                          <input
                            name="postalCode"
                            maxLength={20}
                            defaultValue={user.postalCode}
                            autoComplete="postal-code"
                          />
                        </label>
                      </div>
                      <label>
                        Country code
                        <input
                          name="country"
                          maxLength={2}
                          pattern="[A-Z]{2}"
                          defaultValue={user.country}
                          placeholder="PK"
                          autoComplete="country"
                        />
                        <small>
                          Two capital letters, for example PK for Pakistan.
                        </small>
                      </label>
                      <p className="customer-note">
                        Changes apply to future checkouts. Contact us to update
                        delivery details on an existing order. Email changes
                        require confirmation.
                      </p>
                      <button className="customer-primary" disabled={busy}>
                        {busy ? "Saving…" : "Save changes"}
                        <Check size={17} />
                      </button>
                    </form>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </SupportFrame>
  );
}

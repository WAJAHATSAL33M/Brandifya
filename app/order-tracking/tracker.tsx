"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  LifeBuoy,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import OrderProgress from "./order-progress";
import {
  orderStatusLabels,
  orderReferencePattern,
  type TrackingOrder,
} from "../../lib/order-tracking";
type Lookup = { id: string; contact?: string; key?: string };
const date = (value: string) =>
  new Date(value).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export default function Tracker() {
  const [id, setId] = useState(""),
    [contact, setContact] = useState(""),
    [recent, setRecent] = useState<Lookup | null>(null),
    [order, setOrder] = useState<TrackingOrder | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [checkedAt, setCheckedAt] = useState(""),
    [copied, setCopied] = useState("");
  const credentials = useRef<Lookup | null>(null),
    busyRef = useRef(false),
    result = useRef<HTMLElement>(null),
    errorRef = useRef<HTMLParagraphElement>(null),
    copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function lookup(value: Lookup, background = false) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    if (!background) setOrder(null);
    try {
      const r = await fetch("/api/order-tracking", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = await r.json();
      if (!r.ok)
        throw Error(
          data.error || "We couldn’t check that order. Please try again.",
        );
      credentials.current = value;
      setOrder(data.order);
      setCheckedAt(new Date().toISOString());
      if (!background) requestAnimationFrame(() => result.current?.focus());
    } catch (e) {
      setError(
        (e as Error).message || "We couldn’t connect. Please try again.",
      );
      if (!background) {
        credentials.current = null;
        requestAnimationFrame(() => errorRef.current?.focus());
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const params = new URLSearchParams(location.search),
      requested = params.get("order") || "";
    if (orderReferencePattern.test(requested)) setId(requested);
    let saved: Lookup | null = null;
    try {
      const value = JSON.parse(
        localStorage.getItem("brandifya-last-order") || "null",
      );
      if (
        orderReferencePattern.test(value?.id || "") &&
        orderReferencePattern.test(value?.key || "")
      )
        saved = { id: value.id, key: value.key };
    } catch {}
    setRecent(saved);
    if (saved && (!requested || requested === saved.id)) {
      setId(saved.id);
      void lookup(saved);
    } else if (
      orderReferencePattern.test(requested) &&
      params.get("account") === "1"
    )
      void lookup({ id: requested });
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!order || ["delivered", "cancelled"].includes(order.status)) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && credentials.current)
        void lookup(credentials.current, true);
    }, 60000);
    return () => clearInterval(timer);
  }, [order?.id, order?.status]);
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 2200);
    } catch {
      setError(
        "Copy is unavailable in this browser. Select and copy the reference instead.",
      );
    }
  }
  return (
    <div className="customer-area tracking-area">
      <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Track order</span>
      </nav>
      <header className="tracking-heading">
        <span className="tracking-icon">
          <Truck size={30} />
        </span>
        <h1>Your order. Every step.</h1>
        <p>From confirmation to your doorstep, see where your order stands.</p>
      </header>
      <div className="tracking-layout">
        <aside className="customer-panel tracking-lookup">
          <h2>Find your order</h2>
          <p>
            Use the full reference from your confirmation and the phone or email
            used at checkout.
          </p>
          <form
            className="customer-form"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup({ id: id.trim(), contact });
            }}
            aria-busy={busy}
          >
            <label htmlFor="tracking-reference">
              Order reference
              <input
                id="tracking-reference"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                maxLength={36}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                aria-describedby="tracking-reference-help"
                disabled={busy}
              />
            </label>
            <small id="tracking-reference-help">
              Enter the complete reference, including the hyphens.
            </small>
            <label htmlFor="tracking-contact">
              Checkout phone or email
              <input
                id="tracking-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                maxLength={254}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="03XX XXXXXXX or you@example.com"
                disabled={busy}
              />
            </label>
            <button className="customer-primary" disabled={busy}>
              {busy ? (
                <>
                  <RefreshCw size={17} className="customer-spin" /> Checking…
                </>
              ) : (
                <>
                  <Search size={17} /> Track my order
                </>
              )}
            </button>
          </form>
          {recent && (
            <button
              className="customer-secondary tracking-recent"
              disabled={busy}
              onClick={() => {
                setId(recent.id);
                void lookup(recent);
              }}
            >
              <Package size={17} /> Track recent order in this browser
            </button>
          )}
          <p className="tracking-privacy">
            <ShieldCheck size={15} /> Your contact details are used only to
            verify this lookup.
          </p>
          <div className="tracking-account">
            <strong>Already have an account?</strong>
            <p>See all your purchases and delivery updates together.</p>
            <Link href="/account#orders">
              View my orders <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
        <div className="tracking-results">
          {error && (
            <p
              ref={errorRef}
              tabIndex={-1}
              className="customer-alert"
              role="alert"
            >
              {error}
              {order && " The information below may be out of date."}{" "}
              <Link href="/contact">Contact support</Link>
            </p>
          )}
          {order ? (
            <section
              ref={result}
              tabIndex={-1}
              className="customer-panel tracking-result"
              aria-labelledby="tracking-result-title"
            >
              <div className="tracking-result-top">
                <div>
                  <p>Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <h2 id="tracking-result-title">
                    {orderStatusLabels[order.status] || order.status}
                  </h2>
                  <span>Placed {date(order.createdAt)}</span>
                </div>
                <span
                  className={"customer-order-status status-" + order.status}
                >
                  {order.status === "delivered" ? (
                    <Check size={15} />
                  ) : (
                    <Package size={15} />
                  )}{" "}
                  {orderStatusLabels[order.status] || order.status}
                </span>
              </div>
              <p className="tracking-announcement" role="status">
                {orderStatusLabels[order.status] || order.status}. Last checked{" "}
                {checkedAt &&
                  new Date(checkedAt).toLocaleTimeString("en-PK", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                .
              </p>
              <OrderProgress status={order.status} />
              {order.trackingNumber || order.trackingUrl ? (
                <div className="tracking-shipment">
                  <Truck size={25} />
                  <div>
                    <strong>Courier tracking</strong>
                    {order.trackingNumber && (
                      <p>
                        <span>{order.trackingNumber}</span>
                        <button
                          className="customer-icon-button"
                          aria-label="Copy tracking number"
                          onClick={() =>
                            copy(order.trackingNumber, "tracking number")
                          }
                        >
                          {copied === "tracking number" ? (
                            <Check size={15} />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      </p>
                    )}
                    <small>
                      Courier updates may take time to appear after dispatch.
                    </small>
                  </div>
                  {order.trackingUrl && (
                    <a
                      className="customer-primary"
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track with courier <ArrowRight size={15} />
                    </a>
                  )}
                </div>
              ) : (
                !["cancelled", "delivered"].includes(order.status) && (
                  <p className="customer-note">
                    {order.status === "shipped"
                      ? "Your order has shipped. The courier tracking number will appear here when our team adds it."
                      : "Courier tracking will appear here when your order is dispatched and tracking details are assigned."}
                  </p>
                )
              )}
              <div className="tracking-detail-grid">
                <div>
                  <h3>Status history</h3>
                  {order.events.length ? (
                    <ol className="tracking-events">
                      {order.events.map((event, i) => (
                        <li key={i}>
                          <span aria-hidden="true" />
                          <div>
                            <strong>
                              {orderStatusLabels[event.status] || event.status}
                            </strong>
                            <time dateTime={event.createdAt}>
                              {date(event.createdAt)}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>No additional updates yet.</p>
                  )}
                </div>
                <div>
                  <h3>In this order</h3>
                  <ul className="tracking-items">
                    {order.items.map((item, i) => (
                      <li key={i}>
                        <Package size={16} />
                        <span>
                          {item.name}
                          <small>Quantity: {item.quantity}</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="tracking-total">
                    Order total{" "}
                    <strong>
                      {new Intl.NumberFormat("en-PK", {
                        style: "currency",
                        currency: order.currency,
                      }).format(order.totalMinor / 100)}
                    </strong>
                  </p>
                </div>
              </div>
              <details className="tracking-reference">
                <summary>Full order reference</summary>
                <p>
                  {order.id}
                  <button
                    className="customer-icon-button"
                    aria-label="Copy order reference"
                    onClick={() => copy(order.id, "order reference")}
                  >
                    {copied === "order reference" ? (
                      <Check size={15} />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </p>
              </details>
              <div className="tracking-refresh">
                <p>
                  Store update: {date(order.updatedAt)}
                  <small>
                    Active orders refresh every minute while this page is
                    visible.
                  </small>
                </p>
                <button
                  className="customer-secondary"
                  disabled={busy}
                  onClick={() =>
                    credentials.current && lookup(credentials.current, true)
                  }
                >
                  <RefreshCw
                    size={16}
                    className={busy ? "customer-spin" : ""}
                  />{" "}
                  Refresh status
                </button>
              </div>
            </section>
          ) : (
            <section className="customer-panel tracking-empty" aria-busy={busy}>
              <span className="tracking-icon">
                <Package size={36} />
              </span>
              <h2>
                {busy
                  ? "Finding your order…"
                  : "A clearer picture of your delivery"}
              </h2>
              <p>
                {busy
                  ? "We’re checking the latest information for your order."
                  : "Enter your order details to see preparation, dispatch and delivery updates in one place."}
              </p>
              <div>
                <span>
                  <Check size={17} /> Order confirmed
                </span>
                <span>
                  <Package size={17} /> Prepared with care
                </span>
                <span>
                  <Truck size={17} /> On its way to you
                </span>
              </div>
            </section>
          )}
          <div className="tracking-help">
            <LifeBuoy size={23} />
            <div>
              <strong>Need help finding your order?</strong>
              <p>
                Our team can help with your reference or delivery questions.
              </p>
            </div>
            <Link href="/contact">
              Contact us <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

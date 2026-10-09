"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Headphones,
  House,
  MapPin,
  Package,
  ReceiptText,
  Truck,
  UserRound,
} from "lucide-react";
import { useStore } from "../use-store";
import {
  Breadcrumb,
  CommerceHeader,
  Steps,
  productImage,
} from "../commerce-ui";
import type { OrderReceipt } from "../../lib/order-receipt";
export default function Order() {
  const store = useStore(),
    [order, setOrder] = useState<OrderReceipt | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function verify() {
    setLoading(true);
    setError("");
    try {
      const session = new URLSearchParams(location.search).get("session_id");
      const recent = JSON.parse(
        localStorage.getItem("brandifya-last-order") || "null",
      );
      if (!session && (!recent?.id || !recent?.key)) {
        setOrder(null);
        setError("No verifiable recent order was found in this browser.");
        return;
      }
      const response = await fetch(
        session
          ? `/api/order?session_id=${encodeURIComponent(session)}`
          : `/api/order?order_id=${encodeURIComponent(recent.id)}`,
        {
          cache: "no-store",
          headers: session ? {} : { "X-Order-Key": recent.key },
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "We couldn’t verify your order.");
      setOrder(data);
      if (
        ["confirmed", "paid", "processing", "shipped", "delivered"].includes(
          data.status,
        ) &&
        sessionStorage.getItem("brandifya-payment-order") === data.id
      ) {
        store.clearCart();
        sessionStorage.removeItem("brandifya-checkout");
        sessionStorage.removeItem("brandifya-payment-order");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t verify your order. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    verify();
  }, []);
  const confirmed =
    !!order &&
    ["confirmed", "paid", "processing", "shipped", "delivered"].includes(
      order.status,
    );
  const format = (minor: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: order?.currency || "PKR",
      maximumFractionDigits: 0,
    }).format(minor / 100);
  const stage =
    order?.status === "delivered"
      ? 3
      : order?.status === "shipped"
        ? 2
        : order?.status === "processing"
          ? 1
          : 0;
  return (
    <div className="hp commerce">
      <CommerceHeader store={store} />
      <main className="commerce-container">
        <Breadcrumb label="Order confirmation" />
        <Steps active={4} />
        {loading ? (
          <section className="commerce-panel commerce-empty">
            <Clock3 size={36} />
            <h1>Checking your order…</h1>
            <p role="status">Please wait while we verify its latest status.</p>
          </section>
        ) : !order ? (
          <section className="commerce-panel commerce-empty">
            <ReceiptText size={36} />
            <h1>Order Status</h1>
            <p role="alert">{error}</p>
            <button className="commerce-primary" onClick={verify}>
              Check again
            </button>
            <Link className="commerce-secondary" href="/shop">
              Continue Shopping
            </Link>
          </section>
        ) : (
          <div className="commerce-layout">
            <section className="commerce-panel commerce-confirmation">
              <div className="commerce-confirmation-heading">
                <span className={confirmed ? "is-confirmed" : ""}>
                  {confirmed ? <Check size={35} /> : <Clock3 size={35} />}
                </span>
                <div>
                  <h1>
                    {confirmed
                      ? "Order Confirmed!"
                      : order.status === "cancelled"
                        ? "Order Cancelled"
                        : "Payment Pending"}
                  </h1>
                  <p>
                    {confirmed
                      ? "Thank you for shopping with Brande!"
                      : order.status === "cancelled"
                        ? "This order has been cancelled."
                        : "Your payment has not yet been confirmed."}
                  </p>
                  <small>
                    {confirmed
                      ? order.paymentMethod === "cod"
                        ? "Your order has been received. Payment is due on delivery."
                        : "Your payment is confirmed. Check the latest order status below."
                      : "Your bag is kept until the order is confirmed. If you made a payment, keep your receipt and check again."}
                  </small>
                </div>
              </div>
              {error && (
                <p className="commerce-error" role="alert">
                  {error}
                </p>
              )}
              <div className="commerce-order-meta">
                <div>
                  <ReceiptText size={22} />
                  <span>
                    Order reference<strong>{order.id}</strong>
                  </span>
                </div>
                <div>
                  <CalendarDays size={22} />
                  <span>
                    Order date
                    <strong>
                      {new Date(order.createdAt).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
                <div>
                  <Truck size={22} />
                  <span>
                    Delivery
                    <strong>
                      {order.status === "delivered"
                        ? "Delivered"
                        : order.status === "shipped"
                          ? "Shipped"
                          : "Timing not yet provided"}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="commerce-customer-grid">
                <div>
                  <UserRound size={22} />
                  <section>
                    <h2>Customer Information</h2>
                    <p>{order.customer.name}</p>
                    <p>{order.customer.phone}</p>
                    <p>{order.customer.email}</p>
                  </section>
                </div>
                <div>
                  <MapPin size={22} />
                  <section>
                    <h2>Shipping Address</h2>
                    <p>{order.customer.address}</p>
                    {order.customer.addressLine2 && (
                      <p>{order.customer.addressLine2}</p>
                    )}
                    <p>
                      {[
                        order.customer.city,
                        order.customer.region,
                        order.customer.postalCode,
                        order.customer.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </section>
                </div>
              </div>
              <div className="commerce-receipt-payment">
                <CreditCard size={23} />
                <strong>Payment Method</strong>
                <span>
                  {order.paymentMethod === "cod"
                    ? "Cash on delivery"
                    : "Card payment"}
                </span>
                <small>
                  {order.status === "cancelled"
                    ? "Order cancelled"
                    : order.paymentMethod === "cod"
                      ? "Pay when you receive your order"
                      : confirmed
                        ? "Payment confirmed"
                        : "Awaiting confirmation"}
                </small>
              </div>
              {confirmed && (
                <ol
                  className="commerce-order-progress"
                  aria-label="Order progress"
                >
                  {[
                    { label: "Order placed", icon: Check },
                    { label: "Preparing shipment", icon: Package },
                    { label: "Shipped", icon: Truck },
                    { label: "Delivered", icon: House },
                  ].map(({ label, icon: Icon }, i) => (
                    <li
                      key={label}
                      className={i <= stage ? "is-complete" : ""}
                      aria-current={i === stage ? "step" : undefined}
                    >
                      <span>
                        <Icon size={21} />
                      </span>
                      <strong>{label}</strong>
                      <small>
                        {i < stage
                          ? "Completed"
                          : i === stage
                            ? "Current status"
                            : "Next step"}
                      </small>
                    </li>
                  ))}
                </ol>
              )}
              <div className="commerce-receipt-actions">
                <button className="commerce-primary" onClick={verify}>
                  Refresh Order Status
                  <ArrowRight size={16} />
                </button>
                <Link className="commerce-secondary" href="/shop">
                  Continue Shopping
                </Link>
              </div>
              <div className="commerce-order-help">
                <Headphones size={25} />
                <div>
                  <h2>Need Help?</h2>
                  <p>Contact us with your order reference.</p>
                </div>
                <Link href="/#contact">Contact Support</Link>
              </div>
            </section>
            <aside className="commerce-panel commerce-summary">
              <h2>Order Summary</h2>
              <div className="commerce-receipt-items">
                {order.items.map((item) => (
                  <article key={item.id}>
                    {item.image && (
                      <img
                        src={productImage(item.image)}
                        alt={item.name}
                        width={80}
                        height={80}
                      />
                    )}
                    <div>
                      <strong>{item.name}</strong>
                      {item.color && <small>Color: {item.color}</small>}
                      <small>Qty: {item.quantity}</small>
                    </div>
                    <b>{format(item.price_minor * item.quantity)}</b>
                  </article>
                ))}
              </div>
              <div className="commerce-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {format(order.totalMinor - order.shippingMinor)}
                  </strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>{format(order.shippingMinor)}</strong>
                </div>
                <div className="commerce-total">
                  <span>Total</span>
                  <strong>{format(order.totalMinor)}</strong>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  CreditCard,
  House,
  LockKeyhole,
  MapPin,
  Truck,
  Wallet,
} from "lucide-react";
import { useStore } from "../use-store";
import {
  BagItems,
  Breadcrumb,
  CommerceHeader,
  EmptyBag,
  Steps,
  StoreStatus,
  Totals,
  CheckoutNote,
} from "../commerce-ui";
import { money } from "../../lib/catalog";
export default function Checkout() {
  const store = useStore(),
    [method, setMethod] = useState("cod"),
    [addressType, setAddressType] = useState("Home"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (store.config)
      setMethod(
        store.config.cod ? "cod" : store.config.stripe ? "stripe" : "cod",
      );
  }, [store.config]);
  useEffect(() => {
    if (new URLSearchParams(location.search).has("cancelled"))
      setError(
        "Payment was cancelled. Your bag is saved; no confirmed payment has been recorded.",
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !store.config?.live || store.error || !store.cart.length)
      return;
    setBusy(true);
    setError("");
    const customer = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    );
    customer.country = store.config.country;
    customer.addressType = addressType;
    const fingerprint = JSON.stringify({ cart: store.cart, customer, method });
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
        body: JSON.stringify({
          items: store.cart,
          customer,
          method,
          requestKey,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error || "Checkout could not be completed.");
      if (result.url) {
        sessionStorage.setItem("brandifya-payment-order", result.orderId);
        location.assign(result.url);
        return;
      }
      if (!result.orderId || result.status !== "confirmed")
        throw Error(
          "We couldn’t confirm the order. Please review its status before trying again.",
        );
      localStorage.setItem(
        "brandifya-last-order",
        JSON.stringify({ id: result.orderId, key: requestKey }),
      );
      store.clearCart();
      sessionStorage.removeItem("brandifya-checkout");
      location.assign("/order");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Checkout is unavailable. Please try again.",
      );
      setBusy(false);
    }
  }
  const canOrder =
    !busy &&
    !store.loading &&
    !store.error &&
    !!store.config?.live &&
    store.cart.length > 0 &&
    (method === "cod" ? store.config.cod : store.config.stripe);
  const country = store.config
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(store.config.country)
    : "Loading…";
  return (
    <div className="hp commerce">
      <CommerceHeader store={store} />
      <main className="commerce-container">
        <Breadcrumb label="Checkout" />
        <Steps active={2} />
        <div className="commerce-page-heading">
          <h1>Checkout</h1>
          <p>A few details, then you’re on your way.</p>
        </div>
        <StoreStatus store={store} />
        {store.configError && (
          <div className="commerce-notice" role="alert">
            Checkout settings couldn’t be loaded.{" "}
            <button onClick={store.load}>Try again</button>
          </div>
        )}
        {store.config && !store.config.live && (
          <p className="commerce-notice" role="status">
            Store setup is in progress. You can review the sample checkout;
            orders and payments are not enabled yet.
          </p>
        )}
        {store.loading ? (
          <p className="commerce-loading" role="status">
            Loading checkout…
          </p>
        ) : !store.error && !store.cart.length ? (
          <EmptyBag />
        ) : (
          !store.error && (
            <div className="commerce-layout">
              <form
                id="checkout-details"
                className="commerce-checkout-form"
                onSubmit={submit}
              >
                <section className="commerce-panel">
                  <h2>Customer Information</h2>
                  <div className="commerce-form-grid">
                    <label>
                      Full name
                      <input
                        name="name"
                        required
                        maxLength={120}
                        autoComplete="name"
                        placeholder="Your full name"
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </label>
                    <label>
                      Phone number
                      <input
                        name="phone"
                        type="tel"
                        required
                        maxLength={30}
                        autoComplete="tel"
                        placeholder="+92 300 1234567"
                      />
                    </label>
                    <label>
                      Alternate phone <small>(optional)</small>
                      <input
                        name="alternatePhone"
                        type="tel"
                        maxLength={30}
                        placeholder="Another contact number"
                      />
                    </label>
                  </div>
                </section>
                <section className="commerce-panel">
                  <div className="commerce-section-heading">
                    <h2>Delivery Address</h2>
                    <div
                      className="commerce-address-types"
                      role="group"
                      aria-label="Address type"
                    >
                      {[
                        { name: "Home", icon: House },
                        { name: "Office", icon: Building2 },
                        { name: "Other", icon: MapPin },
                      ].map(({ name, icon: Icon }) => (
                        <button
                          type="button"
                          aria-pressed={addressType === name}
                          key={name}
                          onClick={() => setAddressType(name)}
                        >
                          <Icon size={15} />
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="commerce-form-grid">
                    <label>
                      Country / region
                      <input
                        value={country}
                        readOnly
                        aria-label="Delivery country"
                      />
                    </label>
                    <label>
                      State / province
                      <input
                        name="region"
                        required
                        maxLength={120}
                        autoComplete="address-level1"
                        placeholder="Your state or province"
                      />
                    </label>
                    <label className="commerce-full-field">
                      Full address
                      <input
                        name="address"
                        required
                        maxLength={300}
                        autoComplete="street-address"
                        placeholder="House number, street and area"
                      />
                    </label>
                    <label>
                      Apartment / floor / unit <small>(optional)</small>
                      <input
                        name="addressLine2"
                        maxLength={120}
                        autoComplete="address-line2"
                        placeholder="Apartment or floor"
                      />
                    </label>
                    <label>
                      City
                      <input
                        name="city"
                        required
                        maxLength={120}
                        autoComplete="address-level2"
                        placeholder="Your city"
                      />
                    </label>
                    <label>
                      Postal code
                      <input
                        name="postalCode"
                        required
                        maxLength={20}
                        autoComplete="postal-code"
                        placeholder="Postal code"
                      />
                    </label>
                    <label>
                      Landmark <small>(optional)</small>
                      <input
                        name="landmark"
                        maxLength={160}
                        placeholder="A nearby landmark"
                      />
                    </label>
                  </div>
                </section>
                <section className="commerce-panel">
                  <h2>Delivery Method</h2>
                  <div className="commerce-method-grid">
                    <label className="commerce-method is-selected">
                      <input
                        type="radio"
                        name="delivery"
                        value="standard"
                        defaultChecked
                      />
                      <Truck size={25} />
                      <span>
                        <strong>Standard delivery</strong>
                        <small>Delivery timing confirmed by the store</small>
                      </span>
                      <b>
                        {store.config?.live
                          ? money(store.config.shippingMinor / 100)
                          : "At checkout"}
                      </b>
                    </label>
                    <label className="commerce-method is-unavailable">
                      <input
                        type="radio"
                        name="delivery"
                        value="express"
                        disabled
                      />
                      <Truck size={25} />
                      <span>
                        <strong>Express delivery</strong>
                        <small>Not available currently</small>
                      </span>
                    </label>
                  </div>
                </section>
                <section className="commerce-panel">
                  <h2>Payment Method</h2>
                  <div className="commerce-method-grid commerce-payments">
                    {[
                      {
                        value: "cod",
                        label: "Cash on delivery",
                        copy: "Pay when you receive",
                        icon: Banknote,
                        available: store.config?.cod,
                      },
                      {
                        value: "stripe",
                        label: "Card payment",
                        copy: "Continue to Stripe",
                        icon: CreditCard,
                        available: store.config?.stripe,
                      },
                      {
                        value: "bank",
                        label: "Bank transfer",
                        copy: "Not available",
                        icon: Building2,
                        available: false,
                      },
                      {
                        value: "wallet",
                        label: "Mobile wallet",
                        copy: "Not available",
                        icon: Wallet,
                        available: false,
                      },
                    ].map(({ value, label, copy, icon: Icon, available }) => (
                      <label
                        key={value}
                        className={`commerce-method ${method === value && available ? "is-selected" : ""} ${!available ? "is-unavailable" : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={method === value && !!available}
                          onChange={() => setMethod(value)}
                          disabled={!available}
                        />
                        <Icon size={22} />
                        <span>
                          <strong>{label}</strong>
                          <small>{available ? copy : "Not available"}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="commerce-payment-description">
                    {method === "cod" && store.config?.cod
                      ? "Cash on delivery: payment is due when your order arrives."
                      : method === "stripe" && store.config?.stripe
                        ? "You’ll enter card details on Stripe’s secure payment page."
                        : "Payment options will be available when store setup is complete."}
                  </p>
                  <label className="commerce-order-notes">
                    Order notes <small>(optional)</small>
                    <textarea
                      name="notes"
                      maxLength={500}
                      placeholder="Anything we should know about your delivery?"
                      rows={3}
                    />
                  </label>
                </section>
              </form>
              <aside className="commerce-panel commerce-summary">
                <h2>Order Summary</h2>
                <BagItems store={store} compact />
                <Totals store={store} />
                {error && (
                  <p role="alert" className="commerce-error">
                    {error}
                  </p>
                )}
                <button
                  className="commerce-primary"
                  type="submit"
                  form="checkout-details"
                  disabled={!canOrder}
                >
                  <LockKeyhole size={16} />
                  {busy
                    ? "Processing…"
                    : method === "stripe"
                      ? "Continue to Payment"
                      : "Place Order"}
                  <ArrowRight size={17} />
                </button>
                <Link className="commerce-secondary" href="/cart">
                  Back to Cart
                </Link>
                <CheckoutNote />
              </aside>
            </div>
          )
        )}
      </main>
    </div>
  );
}

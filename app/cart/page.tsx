"use client";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useStore } from "../use-store";
import {
  BagItems,
  Breadcrumb,
  CommerceHeader,
  EmptyBag,
  ProductCards,
  StoreStatus,
  Totals,
  CheckoutNote,
} from "../commerce-ui";
export default function Cart() {
  const store = useStore();
  return (
    <div className="hp commerce">
      <CommerceHeader store={store} />
      <main className="commerce-container">
        <Breadcrumb label="Cart" />
        <div className="commerce-page-heading">
          <h1>Your Shopping Cart</h1>
          <p>Review your items before checkout.</p>
        </div>
        <StoreStatus store={store} />
        {store.loading ? (
          <p className="commerce-loading" role="status">
            Loading your shopping cart…
          </p>
        ) : !store.error && !store.cart.length ? (
          <EmptyBag />
        ) : (
          !store.error && (
            <>
              <div className="commerce-layout">
                <BagItems store={store} />
                <aside className="commerce-panel commerce-summary">
                  <h2>Order Summary</h2>
                  <Totals store={store} />
                  <Link className="commerce-primary" href="/checkout">
                    <LockKeyhole size={16} />
                    Proceed to Checkout
                    <ArrowRight size={17} />
                  </Link>
                  <Link className="commerce-secondary" href="/shop">
                    Continue Shopping
                  </Link>
                  <CheckoutNote />
                  <p className="commerce-summary-help">
                    Need a hand? <Link href="/#contact">Contact us</Link>
                  </p>
                </aside>
              </div>
              <div className="commerce-cart-recommendations">
                <ProductCards
                  items={store.catalog.filter(
                    (p) => !store.cart.some((i) => i.id === p.id),
                  )}
                  store={store}
                />
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}

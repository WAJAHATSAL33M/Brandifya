"use client";
import { useEffect, useState } from "react";
export default function Order() {
  const [message, setMessage] = useState("Checking your order…");
  useEffect(() => {
    const session = new URLSearchParams(location.search).get("session_id");
    if (session) {
      fetch("/api/order?session_id=" + encodeURIComponent(session))
        .then((r) => r.json())
        .then((data) => {
          setMessage(
            data.status === "paid"
              ? `Payment confirmed. Order reference: ${data.id}`
              : "Payment confirmation is still pending. Please keep your payment receipt.",
          );
          if (data.status === "paid") {
            localStorage.removeItem("brandifya-cart");
            sessionStorage.removeItem("brandifya-checkout");
          }
        })
        .catch(() =>
          setMessage(
            "We could not verify payment yet. Please keep your payment receipt.",
          ),
        );
    } else {
      try {
        const order = JSON.parse(
          localStorage.getItem("brandifya-last-order") || "null",
        );
        setMessage(
          order
            ? `Cash-on-delivery order received. Reference: ${order.id}. Payment is due on delivery.`
            : "No recent order was found.",
        );
      } catch {
        setMessage("No recent order was found.");
      }
    }
  }, []);
  return (
    <main className="checkout">
      <a className="brand" href="/">
        <img src="/brande-logo.png" alt="Brande" />
      </a>
      <h1 style={{ margin: "35px 0 15px" }}>Order status</h1>
      <p role="status">{message}</p>
      <a className="primary" style={{ marginTop: 25 }} href="/">
        Return to store
      </a>
    </main>
  );
}

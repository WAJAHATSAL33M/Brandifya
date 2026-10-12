"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SupportFrame from "../../support-frame";
import "../../management.css";
export default function Verify() {
  const [token, setToken] = useState(""),
    [purpose, setPurpose] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("token") || "";
    setToken(t);
    if (!t) {
      setError("This link is incomplete.");
      return;
    }
    fetch("/api/account?token=" + encodeURIComponent(t), { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        setPurpose(d.purpose);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <SupportFrame>
      <header className="support-hero">
        <h1>
          {purpose === "reset" ? "Choose a new password" : "Confirm your email"}
        </h1>
        <p>Finish updating your Brande account.</p>
      </header>
      <section className="account-login management-panel">
        {error && (
          <p role="alert" className="management-alert">
            {error}
          </p>
        )}
        {message ? (
          <>
            <p role="status">{message}</p>
            <Link className="commerce-primary" href="/account">
              Sign in
            </Link>
          </>
        ) : (
          <form
            className="management-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const b = Object.fromEntries(new FormData(e.currentTarget));
                const r = await fetch("/api/account", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...b, action: "verify", token }),
                });
                const d = await r.json();
                if (!r.ok) throw Error(d.error);
                setMessage(d.message);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {purpose === "reset" && (
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
            )}
            <button className="commerce-primary" disabled={busy || !purpose}>
              {busy
                ? "Confirming…"
                : purpose === "reset"
                  ? "Reset password"
                  : "Confirm email"}
            </button>
          </form>
        )}
      </section>
    </SupportFrame>
  );
}

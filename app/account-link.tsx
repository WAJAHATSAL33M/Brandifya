"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
export default function AccountLink() {
  const [signed, setSigned] = useState(false);
  useEffect(() => {
    const load = () => {
      fetch("/api/account", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setSigned(!!d.user))
        .catch(() => {});
    };
    load();
    window.addEventListener("brande-account", load);
    return () => window.removeEventListener("brande-account", load);
  }, []);
  return (
    <Link
      className="store-account-link"
      href="/account"
      aria-label={signed ? "Your account" : "Sign in or create an account"}
    >
      <UserRound size={21} />
      <span>{signed ? "Account" : "Sign in / Sign up"}</span>
    </Link>
  );
}

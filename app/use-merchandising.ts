"use client";
import { useEffect, useState } from "react";
import type { Product } from "../lib/catalog";
import { merchandising } from "../lib/merchandising";
export function useMerchandising(p: Product, live: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!p.promotionStartsAt || !p.promotionEndsAt || !p.promotionActive) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), /countdown/i.test(p.badge || '') ? 1000 : 30000);
    return () => window.clearInterval(timer);
  }, [p.promotionStartsAt, p.promotionEndsAt, p.promotionActive, p.badge]);
  return merchandising(p, now);
}

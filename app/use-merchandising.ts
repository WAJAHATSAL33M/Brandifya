"use client";
import { useEffect, useState } from "react";
import type { Product } from "../lib/catalog";
export function useMerchandising(p: Product, live: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!p.promotionStartsAt || !p.promotionEndsAt) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [p.promotionStartsAt, p.promotionEndsAt]);
  const start = Date.parse(p.promotionStartsAt || ""), end = Date.parse(p.promotionEndsAt || "");
  const promotion = now !== null && p.promotionActive === true && Number.isFinite(start) && Number.isFinite(end) && start < end && now >= start && now < end && p.stock > 0;
  const configured = p.badge?.trim();
  const promotional = !!configured && /flash sale|lightning deal|ends soon|early bird|countdown/i.test(configured);
  const lowStock = live && Number.isSafeInteger(p.stock) && p.stock > 0 && p.stock <= 3;
  const unverifiedCartClaim = !!configured && /people.*cart|in .*carts/i.test(configured);
  const unsupportedStockClaim = !!configured && /few left|almost sold out|only .*left/i.test(configured) && !lowStock;
  const badge = p.id < 0 ? "Design sample" : p.stock === 0 ? "Sold Out" : configured && !unverifiedCartClaim && !unsupportedStockClaim && !configured.includes("%") && (!promotional || promotion) ? (/^new$/i.test(configured) ? "New Arrival" : configured) : promotion ? "Flash Sale" : null;
  return {badge, lowStock, promotion, minutesLeft: promotion && now !== null ? Math.max(1, Math.ceil((end - now) / 60000)) : null};
}

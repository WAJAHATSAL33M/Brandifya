import type { Product } from './catalog';
export function saleState(catalog: Product[], now: number | null) {
  const products = catalog.filter(p => {
    if (p.id < 1 || p.stock < 1 || !Number.isFinite(p.price) || p.price <= 0 || !Number.isFinite(p.originalPrice) || p.originalPrice! <= p.price) return false;
    if (!p.promotionActive) return true;
    const start = Date.parse(p.promotionStartsAt || ''), end = Date.parse(p.promotionEndsAt || '');
    return Number.isFinite(start) && Number.isFinite(end) && start < end && (now === null || now >= start && now < end);
  });
  const ends = products.filter(p => p.promotionActive).map(p => Date.parse(p.promotionEndsAt || '')).filter(end => Number.isFinite(end) && (now === null || end > now));
  return { products, deadline: ends.length ? Math.min(...ends) : null };
}
export function saleTimeLeft(deadline: number, now: number) {
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0'));
}

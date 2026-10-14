import type { Product } from './catalog';
export function merchandising(p: Product, now: number | null) {
  const start = Date.parse(p.promotionStartsAt || ''), end = Date.parse(p.promotionEndsAt || '');
  const promotion = now !== null && p.promotionActive === true && Number.isFinite(start) && Number.isFinite(end) && start < end && now >= start && now < end && p.stock > 0;
  const configured = p.badge?.trim();
  const promotional = !!configured && /flash sale|lightning deal|ends soon|early bird|countdown/i.test(configured);
  const lowStock = Number.isSafeInteger(p.stock) && p.stock > 0 && p.stock <= 3;
  const unsupported = !!configured && (/people.*cart|in .*carts/i.test(configured) || /few left|almost sold out|only .*left/i.test(configured) && !lowStock || /sold out|out of stock/i.test(configured) && p.stock > 0);
  let badge = p.id < 0 ? 'Design sample' : p.stock === 0 ? 'Sold Out' : configured && !unsupported && !configured.includes('%') && (!promotional || promotion) ? (/^new$/i.test(configured) ? 'New Arrival' : configured) : promotion ? 'Flash Sale' : null;
  if (badge && /countdown/i.test(badge) && promotion && now !== null) {
    const seconds = Math.max(0, Math.ceil((end - now) / 1000));
    const days = Math.floor(seconds / 86400), hours = Math.floor(seconds / 3600) % 24;
    badge = days > 0 ? `${days}d ${hours}h` : [hours, Math.floor(seconds / 60) % 60, seconds % 60].map(v => String(v).padStart(2, '0')).join(':');
  }
  return { badge, lowStock, promotion, minutesLeft: promotion && now !== null ? Math.max(1, Math.ceil((end - now) / 60000)) : null };
}

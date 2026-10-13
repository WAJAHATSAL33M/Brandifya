import type { Product } from './catalog';
export type CardChip = { label: string; detail?: string; kind: 'status' | 'sold' };
export function cardChips(p: Product, state: { badge: string | null; lowStock: boolean; promotion: boolean; minutesLeft: number | null }): CardChip[] {
  if (p.stock <= 0 || p.id < 0) return [];
  const chips: CardChip[] = [];
  if (Number.isSafeInteger(p.soldCount) && p.soldCount! > 0) chips.push({ label: `${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(p.soldCount!)} sold`, kind: 'sold' });
  if (state.promotion && state.minutesLeft !== null && state.minutesLeft <= 1440) chips.push({ label: 'Ends Soon', kind: 'status' });
  if (state.lowStock) chips.push({ label: 'Few Left', detail: `Only ${p.stock} left`, kind: 'status' });
  if (Number.isFinite(p.rating) && p.rating! >= 4.5 && p.rating! <= 5 && Number.isSafeInteger(p.reviewCount) && p.reviewCount! >= 20) chips.push({ label: 'Top Rated', kind: 'status' });
  return chips.filter(c => c.label.toLowerCase() !== state.badge?.toLowerCase());
}

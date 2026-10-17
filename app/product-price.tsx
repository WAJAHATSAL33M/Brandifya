import type { CSSProperties } from "react";
import { money } from "../lib/catalog";
function discount(price: number, originalPrice?: number | null) {
  if (!Number.isFinite(price) || price <= 0 || typeof originalPrice !== "number" || !Number.isFinite(originalPrice) || originalPrice <= price) return null;
  const percent = Math.floor((originalPrice - price) / originalPrice * 100);
  return { originalPrice, label: percent > 0 ? percent + "% off" : "Save " + money(originalPrice - price) };
}
export function CardDiscount({ price, originalPrice }: { price: number; originalPrice?: number | null }) {
  const saving = discount(price, originalPrice);
  return saving ? <span className="store-card-discount">{saving.label}</span> : null;
}
export default function ProductPrice({price, originalPrice, className="", card=false}:{price:number;originalPrice?:number|null;className?:string;card?:boolean}) {
  const saving = discount(price, originalPrice);
  // Scale a card's comparison prices together to fit its available inline width.
  const units = money(price).length * 0.7 + (saving ? money(saving.originalPrice).length * 0.53 + 1 : 0);
  const style = card ? { "--card-price-units": units } as CSSProperties : undefined;
  return <span className={className + " product-price-display"} style={style}>
    <strong className="product-price-current">{money(price)}</strong>
    {saving && <><del className="product-price-original" aria-label={"Original price " + money(saving.originalPrice)}>{money(saving.originalPrice)}</del>{!card && <span className="product-price-saving">{saving.label}</span>}</>}
  </span>;
}

import { money } from "../lib/catalog";
export default function ProductPrice({price, originalPrice, className=""}:{price:number;originalPrice?:number|null;className?:string}) {
  const discounted = Number.isFinite(price) && price > 0 && typeof originalPrice === "number" && Number.isFinite(originalPrice) && originalPrice > price;
  const percent = discounted ? Math.floor((originalPrice! - price) / originalPrice! * 100) : 0;
  return <span className={className + " product-price-display"}>
    <strong className="product-price-current">{money(price)}</strong>
    {discounted && <><del className="product-price-original" aria-label={"Original price " + money(originalPrice!)}>{money(originalPrice!)}</del><span className="product-price-saving">{percent > 0 ? percent + "% off" : "Save " + money(originalPrice! - price)}</span></>}
  </span>;
}

import SwipeLoop from "../swipe-loop";
import { ArrowRight, Heart, ShoppingBag, SlidersHorizontal, Sparkles } from "lucide-react";
type Props = {
  categories: {name: string; count: number; image: string}[];
  selected: string[];
  total: number;
  onCategory: (category: string | null) => void;
  onFilters: () => void;
  onWishlist: () => void;
  onBag: () => void;
};
export default function ShopOpening({categories, selected, total, onCategory, onFilters, onWishlist, onBag}: Props) {
  return <>
    <section className="shop-opening" aria-label="Explore the store">
      <div className="shop-opening-main">
        <div className="shop-opening-banner">
          <img src="/heroes/shop-beauty.webp" alt="Skincare bottles and jars arranged on cream stone platforms" width={1860} height={845} fetchPriority="high"/>
          <div><h1>Skin care,<br/><em>made simple.</em></h1><p>Thoughtful finds for your everyday routine. Discover your next beauty essential.</p><button className="shop-opening-action" onClick={() => onCategory("Beauty")}>Explore Beauty<ArrowRight size={17}/></button></div>
        </div>
        <div className="shop-opening-tools" aria-label="Shopping shortcuts">
          <button onClick={onFilters}><SlidersHorizontal size={23}/><span><strong>Find your fit</strong><small>Simple product filters</small></span></button>
          <button onClick={onWishlist}><Heart size={23}/><span><strong>Save your favorites</strong><small>Keep your finds together</small></span></button>
          <button onClick={() => onCategory(null)}><Sparkles size={23}/><span><strong>Explore the details</strong><small>Take a closer look</small></span></button>
          <button onClick={onBag}><ShoppingBag size={23}/><span><strong>Your shopping cart</strong><small>Pick up where you left off</small></span></button>
        </div>
      </div>
    </section>
    {categories.length > 0 && <section className="shop-popular" aria-labelledby="shop-popular-title">
      <div className="shop-section-heading"><h2 id="shop-popular-title">Explore Categories</h2><button className="store-view-all" onClick={() => onCategory(null)}>View all<ArrowRight size={16}/></button></div>
      <SwipeLoop className="shop-category-carousel-viewport" label="Explore Categories"><div className="shop-category-carousel-track">
        {[0, 1].map(copy => <div key={copy} className={`shop-popular-grid${copy ? " shop-category-carousel-copy" : ""}`} aria-hidden={copy ? true : undefined}>
          {categories.map(category => <button key={category.name} tabIndex={copy ? -1 : undefined} aria-pressed={selected.length === 1 && selected[0] === category.name} onClick={() => onCategory(category.name)}><span><img src={category.image} alt="" width={200} height={200} loading="lazy"/></span><strong>{category.name}</strong></button>)}
        </div>)}
      </div></SwipeLoop>
    </section>}
  </>;
}


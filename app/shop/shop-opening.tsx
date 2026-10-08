import { ArrowRight, ChevronRight, Grid2X2, Heart, House, Laptop, Shirt, ShoppingBag, SlidersHorizontal, Sparkles } from "lucide-react";
const icons: Record<string, typeof Heart> = {"Home & Living": House, Fashion: Shirt, Accessories: ShoppingBag, Beauty: Sparkles, Tech: Laptop};
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
      <nav className="shop-departments" aria-label="Shop departments">
        <h2><Grid2X2 size={19}/>Shop by category</h2>
        <div><button aria-pressed={!selected.length} onClick={() => onCategory(null)}><Grid2X2 size={18}/><span>All products</span><small>{total}</small><ChevronRight size={15}/></button>
          {categories.map(category => { const Icon = icons[category.name] || Grid2X2; return <button key={category.name} aria-pressed={selected.length === 1 && selected[0] === category.name} onClick={() => onCategory(category.name)}><Icon size={18}/><span>{category.name}</span><small>{category.count}</small><ChevronRight size={15}/></button>; })}
        </div>
        <p>A little something for every day.</p>
      </nav>
      <div className="shop-opening-main">
        <div className="shop-opening-banner">
          <img src="/heroes/shop-beauty.webp" alt="Skincare bottles and jars arranged on cream stone platforms" width={1860} height={845} fetchPriority="high"/>
          <div><h1>Skin care,<br/><em>made simple.</em></h1><p>Thoughtful finds for your everyday routine. Discover your next beauty essential.</p><button className="shop-opening-action" onClick={() => onCategory("Beauty")}>Explore Beauty<ArrowRight size={17}/></button></div>
        </div>
        <div className="shop-opening-tools" aria-label="Shopping shortcuts">
          <button onClick={onFilters}><SlidersHorizontal size={23}/><span><strong>Find your fit</strong><small>Simple product filters</small></span></button>
          <button onClick={onWishlist}><Heart size={23}/><span><strong>Save your favorites</strong><small>Keep your finds together</small></span></button>
          <button onClick={() => onCategory(null)}><Sparkles size={23}/><span><strong>Explore the details</strong><small>Take a closer look</small></span></button>
          <button onClick={onBag}><ShoppingBag size={23}/><span><strong>Your shopping bag</strong><small>Pick up where you left off</small></span></button>
        </div>
      </div>
    </section>
    {categories.length > 0 && <section className="shop-popular" aria-labelledby="shop-popular-title"><div className="shop-section-heading"><h2 id="shop-popular-title">Explore our categories</h2><button onClick={() => onCategory(null)}>View all<ArrowRight size={16}/></button></div><div className="shop-popular-grid">{categories.map(category => <button key={category.name} aria-pressed={selected.length === 1 && selected[0] === category.name} onClick={() => onCategory(category.name)}><span><img src={category.image} alt="" width={200} height={200} loading="lazy"/></span><strong>{category.name}</strong><small>{category.count} {category.count === 1 ? "find" : "finds"}</small></button>)}</div></section>}
  </>;
}

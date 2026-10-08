"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import "./store-header.css";

const departments = ["Home & Living", "Fashion", "Accessories", "Beauty", "Tech"];
type Props = {
  active: "home" | "shop";
  wishlistCount: number;
  bagCount: number;
  wishlistActive?: boolean;
  onWishlist: () => void;
  onBag: () => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  onSearch?: (query: string) => void;
};
export default function StoreHeader(props: Props) {
  const [mobile, setMobile] = useState(false), [collections, setCollections] = useState(false), [text, setText] = useState("");
  const root = useRef<HTMLElement>(null), toggle = useRef<HTMLButtonElement>(null), collectionsToggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  const query = props.query ?? text;
  const change = (value: string) => props.onQueryChange ? props.onQueryChange(value) : setText(value);
  const close = () => { setMobile(false); setCollections(false); };
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    const resize = () => { if (window.innerWidth > 700) setMobile(false); };
    document.addEventListener("pointerdown", outside); window.addEventListener("resize", resize);
    return () => { document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", resize); };
  }, []);
  return <header className="store-header" ref={root} onKeyDown={e => { if (e.key === "Escape") { close(); (mobile ? toggle : collectionsToggle).current?.focus(); } }}>
    <div className="store-header-main hp-container">
      <Link className="hp-logo" href="/" aria-label="Brande home"><img src="/brande-original.png" alt="Brande — Buy Branded with Brande.pk" /></Link>
      <form className="store-header-search" role="search" onSubmit={e => { e.preventDefault(); close(); if (props.onSearch) props.onSearch(query); else window.location.assign(`/shop${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`); }}>
        <Search size={19} aria-hidden="true" />
        <input aria-label="Search products" type="search" placeholder="Find your next favorite…" maxLength={200} value={query} onChange={e => change(e.target.value)} />
        {query && <button className="store-header-clear" type="button" aria-label="Clear search" onClick={() => change("")}><X size={16}/></button>}
        <button className="store-header-search-submit" type="submit">Search<ArrowRight size={16}/></button>
      </form>
      <div className="store-header-actions">
        <button aria-label={`Open wishlist, ${props.wishlistCount} items`} aria-pressed={props.wishlistActive} onClick={() => { close(); props.onWishlist(); }}><Heart size={22}/><span className="store-header-count">{props.wishlistCount}</span><span className="store-header-action-label">Wishlist</span></button>
        <button aria-label={`Open shopping bag, ${props.bagCount} items`} onClick={() => { close(); props.onBag(); }}><ShoppingBag size={22}/><span className="store-header-count">{props.bagCount}</span><span className="store-header-action-label">Your bag</span></button>
        <button className="store-header-toggle" ref={toggle} aria-label="Toggle navigation" aria-expanded={mobile} aria-controls={id} onClick={() => { setMobile(!mobile); setCollections(false); }}>{mobile ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
    </div>
    <div className={`store-header-bottom ${mobile ? "is-open" : ""}`} id={id}>
      <div className="hp-container store-header-nav-row">
        <nav className="store-header-nav" aria-label="Main navigation">
          <Link href="/" aria-current={props.active === "home" ? "page" : undefined} onClick={close}>Home</Link>
          <Link href="/#confidence" onClick={close}>About</Link>
          <div className="store-header-collections" onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setCollections(true); }} onMouseLeave={() => setCollections(false)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setCollections(false); }}>
            <Link href="/shop" aria-current={props.active === "shop" ? "page" : undefined} onClick={close}>Shop</Link>
            <button ref={collectionsToggle} aria-label="Browse shop collections" aria-expanded={collections} aria-controls={`${id}-collections`} onClick={() => setCollections(!collections)}><ChevronDown size={15}/></button>
            {collections && <div className="store-header-dropdown" id={`${id}-collections`}><strong>Find your everyday favorites</strong><div>{departments.map(category => <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} onClick={close}>{category}<ArrowRight size={15}/></Link>)}</div><Link className="store-header-view-all" href="/shop" onClick={close}>Explore all products<ArrowRight size={16}/></Link></div>}
          </div>
          <Link href="/#journal" onClick={close}>Journal</Link>
          <Link href="/#contact" onClick={close}>Contact</Link>
        </nav>
        <Link className="store-header-discover" href="/shop" onClick={close}>Everyday essentials. Thoughtfully found.<ArrowRight size={16}/></Link>
      </div>
    </div>
  </header>;
}

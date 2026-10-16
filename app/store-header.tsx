"use client";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccountLink from "./account-link";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Grid2X2,
  Heart,
  House,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { categoryHref } from "../lib/categories";
import "./store-header.css";
const departments = [
  { name: "Home & Living", image: "/categories/home.webp" },
  { name: "Fashion", image: "/categories/fashion.webp" },
  { name: "Accessories", image: "/products/featured0.webp" },
  { name: "Beauty", image: "/products/featured5.webp" },
  { name: "Tech", image: "/categories/electronics.webp" },
  { name: "Grocery", image: "/categories/grocery.webp" },
  { name: "Sports & Fitness", image: "/products/featured2.webp" },
  { name: "Watches", image: "/products/best1.webp" },
  { name: "Footwear", image: "/products/featured6.webp" },
];
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
  const router = useRouter();
  const [tappedCategory, setTappedCategory] = useState<string | null>(null);
  const categoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobile, setMobile] = useState(false),
    [collections, setCollections] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [text, setText] = useState("");
  const root = useRef<HTMLElement>(null),
    toggle = useRef<HTMLButtonElement>(null),
    collectionsToggle = useRef<HTMLButtonElement>(null),
    searchToggle = useRef<HTMLButtonElement>(null),
    searchInput = useRef<HTMLInputElement>(null);
  const id = useId(),
    pathname = usePathname(),
    query = props.query ?? text;
  const change = (value: string) =>
    props.onQueryChange ? props.onQueryChange(value) : setText(value);
  const close = () => {
    setMobile(false);
    setCollections(false);
    setTappedCategory(null);
  };
  function openSearch() {
    close();
    setSearchOpen(true);
    root.current?.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(() => searchInput.current?.focus());
  }
  function openCollections() {
    setMobile(true);
    setCollections(true);
    setSearchOpen(false);
    root.current?.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(() => collectionsToggle.current?.focus());
  }
  useEffect(() => {
    if (props.query) setSearchOpen(true);
  }, [props.query]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const resize = () => {
      if (innerWidth > 900) setMobile(false);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      if (categoryTimer.current) clearTimeout(categoryTimer.current);
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <header
      className="store-header"
      ref={root}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (searchOpen) {
            setSearchOpen(false);
            searchToggle.current?.focus();
          } else {
            close();
            (mobile ? toggle : collectionsToggle).current?.focus();
          }
        }
      }}
    >
      <div className="store-header-main hp-container">
        <button
          className="store-header-toggle"
          ref={toggle}
          aria-label="Toggle navigation"
          aria-expanded={mobile}
          aria-controls={id}
          onClick={() => {
            setMobile(!mobile);
            setCollections(!mobile);
            setSearchOpen(false);
          }}
        >
          {mobile ? <X size={23} /> : <Menu size={23} />}
        </button>
        <Link className="hp-logo" href="/" aria-label="Brande home">
          <img
            src="/brande-original.png"
            alt="Brande — Buy Branded with Brande.pk"
          />
        </Link>
        <div
          className={`store-header-bottom ${mobile ? "is-open" : ""}`}
          id={id}
        >
          <nav className="store-header-nav" aria-label="Main navigation">
            <Link
              href="/"
              aria-current={props.active === "home" ? "page" : undefined}
              onClick={close}
            >
              Home
            </Link>
            <div
              className="store-header-collections"
              onMouseLeave={() => { if (!mobile) setCollections(false); }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget))
                  setCollections(false);
              }}
            >
              <button
                className="store-header-shop-toggle"
                ref={collectionsToggle}
                type="button"
                aria-current={props.active === "shop" ? "page" : undefined}
                aria-expanded={collections}
                aria-controls={`${id}-collections`}
                onClick={() => setCollections(open => !open)}
              >
                <span>Shop</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {collections && (
                <div className="store-header-dropdown" id={`${id}-collections`}>
                  <strong>Explore our collections</strong>
                  <div>
                    {departments.map(({ name, image }) => (
                      <Link
                        key={name}
                        className={`store-header-category-tile${tappedCategory === name ? " is-selected" : ""}`}
                        href={categoryHref(name)}
                        onNavigate={(event) => {
                          if (!window.matchMedia("(max-width: 900px)").matches) { close(); return; }
                          event.preventDefault();
                          if (categoryTimer.current) clearTimeout(categoryTimer.current);
                          setTappedCategory(name);
                          const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
                          categoryTimer.current = setTimeout(() => { close(); router.push(categoryHref(name)); }, delay);
                        }}
                      >
                        <span className="store-header-category-icon"><img src={image} alt="" width={42} height={42} loading="lazy" /></span>
                        <span>{name}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    className="store-header-view-all"
                    href="/shop"
                    onClick={close}
                  >
                    Explore All Products
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
            <Link href="/about" onClick={close}>
              About
            </Link>
            <Link href="/blog" onClick={close}>
              Journal
            </Link>
            <Link href="/contact" onClick={close}>
              Contact
            </Link>
            <AccountLink />
          </nav>
        </div>
        <div className="store-header-actions">
          <AccountLink />
          <button
            className="store-header-wishlist"
            aria-label={`Open favorites, ${props.wishlistCount} items`}
            aria-pressed={props.wishlistActive}
            onClick={() => {
              close();
              props.onWishlist();
            }}
          >
            <Heart size={23} />
            {props.wishlistCount > 0 && (
              <span className="store-header-count">{props.wishlistCount}</span>
            )}
          </button>
          <button
            ref={searchToggle}
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls={`${id}-search`}
            onClick={() => (searchOpen ? setSearchOpen(false) : openSearch())}
          >
            <Search size={23} />
          </button>
          <button
            aria-label={`Open shopping cart, ${props.bagCount} items`}
            onClick={() => {
              close();
              props.onBag();
            }}
          >
            <ShoppingCart size={24} />
            {props.bagCount > 0 && (
              <span className="store-header-count">{props.bagCount}</span>
            )}
          </button>
        </div>
      </div>
      <form
        id={`${id}-search`}
        className={`store-header-search hp-container ${searchOpen ? "is-open" : ""}`}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          close();
          if (props.onSearch) props.onSearch(query);
          else
            location.assign(
              `/shop${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
            );
        }}
      >
        <Search size={19} aria-hidden="true" />
        <input
          ref={searchInput}
          aria-label="Search products"
          type="search"
          placeholder="Search products, categories or colors"
          maxLength={200}
          value={query}
          onChange={(e) => change(e.target.value)}
        />
        {query && (
          <button
            className="store-header-clear"
            type="button"
            aria-label="Clear search"
            onClick={() => {
              change("");
              searchInput.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
        <button className="store-header-search-submit" type="submit">
          Search
          <ArrowRight size={16} />
        </button>
      </form>
      <nav className="store-mobile-bar" aria-label="Mobile quick navigation">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
          <House size={21} />
          <span>Home</span>
        </Link>
        <button
          aria-label="Open collections"
          aria-controls={id}
          aria-expanded={mobile && collections}
          onClick={openCollections}
        >
          <Grid2X2 size={21} />
          <span>Categories</span>
        </button>
        <button aria-label="Search store" onClick={openSearch}>
          <Search size={21} />
          <span>Search</span>
        </button>
        <button
          aria-label={`Show favorites, ${props.wishlistCount} items`}
          aria-pressed={props.wishlistActive}
          onClick={() => {
            close();
            props.onWishlist();
          }}
        >
          <Heart size={21} />
          <span>Favorites</span>
        </button>
        <button
          aria-label={`View cart, ${props.bagCount} items`}
          onClick={() => {
            close();
            props.onBag();
          }}
        >
          <ShoppingCart size={21} />
          <span>Cart</span>
          {props.bagCount > 0 && <b>{props.bagCount}</b>}
        </button>
      </nav>
    </header>
  );
}


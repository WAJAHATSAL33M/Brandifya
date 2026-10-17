import Link from "next/link";
import { useEffect, useRef } from "react";
import PromoBanner from "../promo-banner";
import { ArrowRight } from "lucide-react";
import { categoryDesigns, categoryHref, categoryBanners } from "../../lib/categories";
export default function CategoryOpening({
  name,
  count,
  loading,
  failed,
  collections,
}: {
  name: string;
  count: number;
  loading: boolean;
  failed: boolean;
  collections: { name: string; count: number; image: string }[];
}) {
  const rail = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = rail.current;
    const active = container?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!container || !active || container.scrollWidth <= container.clientWidth)
      return;
    const left =
      active.getBoundingClientRect().left -
      container.getBoundingClientRect().left +
      container.scrollLeft;
    container.scrollLeft = Math.max(
      0,
      left - (container.clientWidth - active.clientWidth) / 2,
    );
  }, [name, collections.length]);
  const design = categoryDesigns[name] || {
    description: `Explore our ${name.toLowerCase()} collection. Search and filter the products to find your next favorite.`,
  };
  return (
    <>
      <PromoBanner
        name={name}
        hero
        description={design.description}
        images={categoryBanners[name] || [design.image || collections.find(c => c.name === name)?.image || "/heroes/everyday.webp", "/heroes/home-tech.webp", "/heroes/fashion.webp"]}
        contain={!['Fashion', 'Beauty', 'Tech'].includes(name)}
      />
      <nav
        ref={rail}
        className="category-collections"
        aria-label="Explore collections"
      >
        <Link className="category-all" href="/shop">
          All products
          <ArrowRight size={15} />
        </Link>
        {collections.map((c) => (
          <Link
            key={c.name}
            href={categoryHref(c.name)}
            aria-current={c.name === name ? "page" : undefined}
          >
            <img src={c.image} alt="" width={40} height={40} />
            <span>
              {c.name}

            </span>
          </Link>
        ))}
      </nav>
      <div className="category-results-heading">
        <h2>Explore {name}</h2>
      </div>
    </>
  );
}


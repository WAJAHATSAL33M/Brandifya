"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '../lib/catalog';
import { saleState, saleTimeLeft } from '../lib/sale-products';
import ProductCard from './product-card';
import SwipeLoop from './swipe-loop';
export default function SaleProducts({ catalog, saved, onSave, live }: { catalog: Product[]; saved: number[]; onSave: (id: number) => void; live: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const { products, deadline } = saleState(catalog, now);
  if (!products.length) return null;
  const time = deadline !== null && now !== null ? saleTimeLeft(deadline, now) : ['--', '--', '--', '--'];
  return <section className="hp-featured hp-container sale-products" aria-labelledby="sale-products-title">
    <div className="sale-products-heading">
      <h2 id="sale-products-title">On Sale</h2>
      {deadline !== null && <div className="sale-countdown" role="timer" aria-label="Time until the next sale offer ends" aria-live="off">
        <span className="sale-countdown-caption">Ends in</span>
        <div className="sale-countdown-units">{['Days', 'Hours', 'Minutes', 'Seconds'].map((label, i) => <span className="sale-countdown-unit" key={label}><strong>{time[i]}</strong><small>{label}</small></span>)}</div>
      </div>}
      <Link className="sale-see-all" href="/shop">See all<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <SwipeLoop className="featured-carousel-viewport sale-carousel-viewport" label="Sale products" advance="card" direction="reverse">
      <div className="featured-carousel-track">
        {(products.length > 2 ? [0, 1] : [0]).map(copy => <div key={copy} className={`hp-featured-grid${copy ? ' featured-carousel-copy' : ''}`} aria-hidden={copy ? true : undefined}>
          {products.map(p => <ProductCard key={p.id} product={p} saved={saved.includes(p.id)} onSave={() => onSave(p.id)} live={live} tabIndex={copy ? -1 : undefined} />)}
        </div>)}
      </div>
    </SwipeLoop>
  </section>;
}

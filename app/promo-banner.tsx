"use client";
import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import Link from "next/link";
import { categoryHref } from "../lib/categories";

export default function PromoBanner({ name, images, description, hero = false, contain = false }: {
  name: string; images: string[]; description?: string; hero?: boolean; contain?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const suppressClick = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(motion.matches);
    const visibility = () => setVisible(!document.hidden);
    update(); visibility();
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => { motion.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (paused || focused || touching || reducedMotion || !visible) return;
    const timer = setTimeout(() => setIndex(current => current + 1), 2000);
    return () => clearTimeout(timer);
  }, [index, paused, focused, touching, reducedMotion, visible]);
  useEffect(() => {
    if (index < images.length) return;
    const timer = setTimeout(() => { setInstant(true); setIndex(0); }, reducedMotion ? 0 : 420);
    return () => clearTimeout(timer);
  }, [index, images.length, reducedMotion]);
  useEffect(() => {
    if (!instant) return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setInstant(false)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [instant]);
  const interactions: HTMLAttributes<HTMLElement> = {
    onMouseEnter: () => { if (window.matchMedia("(hover: hover)").matches) setPaused(true); },
    onMouseLeave: () => setPaused(false),
    onFocus: event => setFocused(event.currentTarget.matches(":focus-visible")),
    onBlur: () => setFocused(false),
    onClick: event => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false; } },
    onTouchStart: event => { suppressClick.current = false; setTouching(true); const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; },
    onTouchCancel: () => { setTouching(false); touch.current = null; },
    onTouchEnd: event => {
      setTouching(false); const start = touch.current; touch.current = null;
      const end = event.changedTouches[0];
      if (!start || !end) return;
      const dx = end.clientX - start.x, dy = end.clientY - start.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressClick.current = true;
        setIndex(current => dx < 0 ? Math.min(current + 1, images.length) : Math.max(0, current - 1));
      }
    },
  };
  const content = <>
    <div className={`promo-image-track${instant ? " is-resetting" : ""}`} style={{ transform: `translateX(-${index * 100}%)` }} aria-hidden="true">
      {[...images, images[0]].map((src, i) => <img key={`${src}-${i}`} className={contain ? "is-cutout" : undefined} src={src} alt="" width={hero ? 1200 : 600} height={hero ? 600 : 300} loading={hero && i === 0 ? "eager" : "lazy"} draggable={false} />)}
    </div>
    <div className={hero ? "category-banner-copy" : "promo-banner-copy"}>
      {hero ? <h1>{name}</h1> : <h3>{name}</h3>}
      {description && <p className="promo-description">{description}</p>}
      {!hero && <span className="promo-explore">Explore</span>}
    </div>
  </>;
  return hero
    ? <section className="category-hero category-banner" role="region" aria-roledescription="carousel" aria-label={`${name} collection`} tabIndex={0} {...interactions}>{content}</section>
    : <Link href={categoryHref(name)} aria-label={`Explore ${name}`} className="promo-banner" {...interactions}>{content}</Link>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categoryHref } from "../lib/categories";

export default function PromoBanner({ name, images }: { name: string; images: string[] }) {
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
  return <Link href={categoryHref(name)} aria-label={`Explore ${name}`} className="promo-banner"
    onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setPaused(true); }}
    onMouseLeave={() => setPaused(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    onClick={event => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false; } }}
    onTouchStart={event => { suppressClick.current = false; setTouching(true); const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; }}
    onTouchCancel={() => { setTouching(false); touch.current = null; }}
    onTouchEnd={event => {
      setTouching(false); const start = touch.current; touch.current = null;
      const end = event.changedTouches[0];
      if (!start || !end) return;
      const dx = end.clientX - start.x, dy = end.clientY - start.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressClick.current = true;
        setIndex(current => dx < 0 ? Math.min(current + 1, images.length) : Math.max(0, current - 1));
      }
    }}>
    <div className={`promo-image-track${instant ? " is-resetting" : ""}`} style={{ transform: `translateX(-${index * 100}%)` }} aria-hidden="true">
      {[...images, images[0]].map((src, i) => <img key={`${src}-${i}`} src={src} alt="" width={600} height={300} loading="lazy" draggable={false} />)}
    </div>
    <div className="promo-banner-copy"><h3>{name}</h3><span className="promo-explore">Explore</span></div>
  </Link>;
}

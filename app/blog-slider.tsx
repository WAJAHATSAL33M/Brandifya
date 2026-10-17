"use client";
import { useEffect, useRef, type ReactNode } from "react";

export default function BlogSlider({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const interacting = useRef(false);
  const pause = () => { pauseUntil.current = Date.now() + 5000; };
  const move = (direction: number) => {
    const el = rail.current;
    if (!el) return;
    const step = el.firstElementChild?.getBoundingClientRect().width || el.clientWidth;
    const next = (Math.round(el.scrollLeft / step) + direction + el.children.length) % el.children.length;
    el.scrollTo({ left: next * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (window.matchMedia("(max-width: 700px)").matches &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          !document.hidden && !interacting.current && Date.now() >= pauseUntil.current &&
          !rail.current?.contains(document.activeElement)) move(1);
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="hp-blog-slider">
    <div id="homepage-blog-slides" className="hp-blog-grid" ref={rail}
      role="region" aria-label="Latest blogs" tabIndex={0}
      onTouchStart={() => { interacting.current = true; pause(); }}
      onTouchEnd={() => { interacting.current = false; pause(); }}
      onTouchCancel={() => { interacting.current = false; pause(); }}
      onMouseEnter={() => { interacting.current = true; }}
      onMouseLeave={() => { interacting.current = false; pause(); }}
      onWheel={pause} onFocus={pause}
      onKeyDown={(event) => { if (window.matchMedia("(max-width: 700px)").matches && (event.key === "ArrowRight" || event.key === "ArrowLeft")) { event.preventDefault(); pause(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      {children}
    </div>
  </div>;
}

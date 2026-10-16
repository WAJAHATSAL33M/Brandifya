"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Native touch scrolling keeps momentum; autoplay advances the same scroll position. */
export default function SwipeLoop({ children, className, label, advance = "continuous" }: {
  children: ReactNode;
  className: string;
  label: string;
  advance?: "continuous" | "card";
}) {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rail = viewport.current;
    if (!rail) return;
    const mobile = window.matchMedia("(max-width: 700px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let held = false, touching = false, resumeAt = 0, previous = 0, position = rail.scrollLeft, frame = 0;
    let nextSlideAt = performance.now() + 1400;
    const pause = () => { resumeAt = performance.now() + 3000; nextSlideAt = resumeAt; position = rail.scrollLeft; };
    const start = () => { held = true; pause(); };
    const end = () => { held = false; pause(); };
    const touchStart = () => { touching = true; pause(); };
    const touchEnd = () => { touching = false; end(); };
    rail.addEventListener("pointerdown", start, { passive: true });
    window.addEventListener("pointerup", end, { passive: true });
    window.addEventListener("pointercancel", end, { passive: true });
    rail.addEventListener("touchstart", touchStart, { passive: true });
    rail.addEventListener("touchend", touchEnd, { passive: true });
    rail.addEventListener("touchcancel", touchEnd, { passive: true });
    rail.addEventListener("wheel", pause, { passive: true });
    const tick = (now: number) => {
      const elapsed = previous ? Math.min(now - previous, 50) : 0;
      previous = now;
      const group = rail.firstElementChild?.firstElementChild as HTMLElement | null;
      const loopWidth = group?.getBoundingClientRect().width || 0;
      const hovering = window.matchMedia("(hover: hover)").matches && rail.matches(":hover");
      if (mobile.matches && !motion.matches && !document.hidden && !held && !touching && now >= resumeAt &&
          !hovering && !rail.contains(document.activeElement) && (rail.firstElementChild?.children.length || 0) > 1 && loopWidth > rail.clientWidth) {
        if (advance === "card") {
          if (now >= nextSlideAt) {
            if (rail.scrollLeft >= loopWidth - 1) rail.scrollLeft -= loopWidth;
            const card = group?.firstElementChild as HTMLElement | null;
            const gap = group ? parseFloat(getComputedStyle(group).columnGap) || 0 : 0;
            const step = (card?.getBoundingClientRect().width || 180) + gap;
            rail.scrollTo({ left: (Math.round(rail.scrollLeft / step) + 1) * step, behavior: "smooth" });
            nextSlideAt = now + 1400;
          }
        } else {
          position += elapsed * 0.028;
          if (position >= loopWidth) position -= loopWidth;
          rail.scrollLeft = position;
        }
      } else {
        position = rail.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      rail.removeEventListener("pointerdown", start);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      rail.removeEventListener("touchstart", touchStart);
      rail.removeEventListener("touchend", touchEnd);
      rail.removeEventListener("touchcancel", touchEnd);
      rail.removeEventListener("wheel", pause);
    };
  }, [advance]);
  return <div ref={viewport} className={`${className} swipe-loop`} role="region" aria-label={label}>{children}</div>;
}

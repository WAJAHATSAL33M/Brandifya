"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "./hero-slider.css";
const slides = [
  {
    title: "Everyday finds.", emphasis: "Extraordinary style.",
    description: "Discover the essentials that bring a little more style, comfort and simplicity to your day.",
    action: "Shop All", href: "/shop", theme: "dark", label: "Everyday essentials",
    image: "/heroes/everyday.webp",
  },
  {
    title: "Your style.", emphasis: "Your everyday.",
    description: "From your go-to bag to your favorite pair of shoes, find the pieces that feel like you.",
    action: "Explore Fashion", href: "/shop?category=Fashion&category=Accessories", theme: "cream", label: "Fashion and accessories",
    image: "/heroes/fashion.webp",
  },
  {
    title: "Small upgrades.", emphasis: "Better days.",
    description: "Bring ease to your space and your routine with thoughtful home essentials and everyday tech.",
    action: "Explore Home & Tech", href: "/shop?category=Home+%26+Living&category=Tech", theme: "light", label: "Home and tech",
    image: "/heroes/home-tech.webp",
  },
];
export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches);
    const visibility = () => setVisible(!document.hidden);
    motion(); visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => { media.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (hovered || touching || focused || paused || reducedMotion || !visible) return;
    const timer = window.setTimeout(() => setIndex(current => (current + 1) % slides.length), 5000);
    return () => window.clearTimeout(timer);
  }, [index, hovered, touching, focused, paused, reducedMotion, visible]);
  const touch = useRef<{x:number;y:number}|null>(null);
  const slide = slides[index];
  const move = (direction:number) => setIndex(current=>(current+direction+slides.length)%slides.length);
  return <section className={`home-hero home-hero-${slide.theme}`} role="region" aria-roledescription="carousel" aria-label="Featured collections" tabIndex={0}
    onMouseEnter={() => { if (window.matchMedia("(hover: hover)").matches) setHovered(true); }} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
    onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1);}}}
    onTouchStart={e=>{setTouching(true);if(e.touches.length===1)touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};else touch.current=null;}}
    onTouchCancel={()=>{setTouching(false);touch.current=null;}}
    onTouchEnd={e=>{setTouching(false);const start=touch.current;touch.current=null;if(!start||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*1.4)move(dx<0?1:-1);}}>
    <div className="home-hero-images" aria-hidden="true">
      {slides.map((s, i) => <img key={s.image} className={index === i ? "is-active" : ""} src={s.image} alt="" width={2172} height={724} loading="eager" fetchPriority={i === 0 ? "high" : "auto"} draggable={false}/>)}
    </div>
    <div className="home-hero-inner">
      <div className="home-hero-copy">
        {slides.map((item, i) => <div key={item.image}
          className={`home-hero-slide-copy${i === index ? " is-active" : ""}`}
          role="group" aria-roledescription="slide" aria-label={`${i+1} of ${slides.length}: ${item.label}`}
          aria-hidden={i !== index} inert={i !== index}>
          <h1>{item.title}<br/><em>{item.emphasis}</em></h1>
          <p>{item.description}</p>
          <Link className="home-hero-action" href={item.href}>{item.action}<span><ArrowRight size={18}/></span></Link>
        </div>)}
      </div>
    </div>
    <button className="home-hero-pause" onClick={() => setPaused(current => !current)}>{paused ? "Resume automatic banners" : "Pause automatic banners"}</button>
  </section>;
}

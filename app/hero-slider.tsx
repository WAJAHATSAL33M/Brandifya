"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import "./hero-slider.css";
const slides = [
  {
    title: "Everyday finds.", emphasis: "Extraordinary style.",
    description: "Discover the essentials that bring a little more style, comfort and simplicity to your day.",
    action: "Shop All", href: "/shop", theme: "dark", label: "Everyday essentials",
    photos: ["featured0", "featured1", "featured7"], alts: ["Vintage leather backpack", "Ceramic aroma diffuser", "Portable Bluetooth speaker"],
  },
  {
    title: "Your style.", emphasis: "Your everyday.",
    description: "From your go-to bag to your favorite pair of shoes, find the pieces that feel like you.",
    action: "Explore Fashion", href: "/shop?category=Fashion&category=Accessories", theme: "cream", label: "Fashion and accessories",
    photos: ["featured3", "featured6", "featured0"], alts: ["Everyday tote bag", "Casual loafers", "Vintage leather backpack"],
  },
  {
    title: "Small upgrades.", emphasis: "Better days.",
    description: "Bring ease to your space and your routine with thoughtful home essentials and everyday tech.",
    action: "Explore Home & Tech", href: "/shop?category=Home+%26+Living&category=Tech", theme: "light", label: "Home and tech",
    photos: ["featured4", "featured7", "featured1"], alts: ["Electric kettle", "Portable Bluetooth speaker", "Ceramic aroma diffuser"],
  },
];
export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const touch = useRef<{x:number;y:number}|null>(null);
  const slide = slides[index];
  const move = (direction:number) => setIndex(current=>(current+direction+slides.length)%slides.length);
  return <section className={`home-hero home-hero-${slide.theme}`} role="region" aria-roledescription="carousel" aria-label="Featured collections" tabIndex={0}
    onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();move(e.key==="ArrowLeft"?-1:1);}}}
    onTouchStart={e=>{if(e.touches.length===1)touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};else touch.current=null;}}
    onTouchCancel={()=>{touch.current=null;}}
    onTouchEnd={e=>{const start=touch.current;touch.current=null;if(!start||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*1.4)move(dx<0?1:-1);}}>
    <div className="home-hero-inner" key={index} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${slides.length}: ${slide.label}`}>
      <div className="home-hero-copy"><h1>{slide.title}<br/><em>{slide.emphasis}</em></h1><p>{slide.description}</p><Link className="home-hero-action" href={slide.href}>{slide.action}<span><ArrowRight size={18}/></span></Link></div>
      <div className="home-hero-art" aria-label={slide.label}>
        {slide.photos.map((photo,i)=><div className={`home-hero-photo home-hero-photo-${i}`} key={photo}><img src={`/products/${photo}.webp`} alt={slide.alts[i]} loading={index===0?"eager":"lazy"} fetchPriority={index===0&&i===0?"high":"auto"} width={1024} height={1024} draggable={false}/></div>)}
      </div>
    </div>
    <div className="home-hero-controls"><button aria-label="Previous banner" onClick={()=>move(-1)}><ChevronLeft size={19}/></button><div className="home-hero-dots" aria-label="Choose a banner">{slides.map((s,i)=><button key={s.label} aria-label={`Show banner ${i+1}: ${s.label}`} aria-current={index===i?"true":undefined} onClick={()=>setIndex(i)}><span/></button>)}</div><button aria-label="Next banner" onClick={()=>move(1)}><ChevronRight size={19}/></button></div>
    <span className="home-hero-announcement" role="status" aria-live="polite" aria-atomic="true">Banner {index+1} of {slides.length}: {slide.label}</span>
  </section>;
}

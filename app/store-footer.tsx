"use client";
import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, Phone, ChevronRight, X, Check } from "lucide-react";
import art from "../lib/home-art.json";
function Art({
  name,
  alt,
  eager = false,
}: {
  name: string;
  alt: string;
  eager?: boolean;
}) {
  const a = art.assets[name as keyof typeof art.assets];
  return (
    <span className="hp-art" style={{ aspectRatio: `${a.w}/${a.h}` }}>
      <img
        src="/homepage-design.webp"
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        style={{
          width: `${(art.width / a.w) * 100}%`,
          left: 0,
          top: 0,
          transform: `translate(${(-a.x / art.width) * 100}%, ${(-a.y / art.height) * 100}%)`,
        }}
      />
    </span>
  );
}

const policies: Record<string,string> = {
  "Size Guide": "Product-specific measurements and fit guidance will be supplied with the final catalog.",
  "Gift Cards": "Gift cards are not currently available.",
  "Social profiles": "The store’s social profiles will be connected here.",
  "Track Order": "Your order reference is available on the order confirmation page. Customer order tracking is being configured.",
  "Shipping & returns": "Delivery areas, shipping fees, timelines, and return terms will be published once the merchant confirms them. Products cannot currently be ordered.",
  "About Brandifya": "Brandifya is a general-store concept bringing home, style, tech, and everyday essentials together. This storefront currently uses sample products and prices.",
  "Contact us": process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? `Contact our team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.` : "Customer support details are being set up. This demo does not collect contact requests.",
};
export default function StoreFooter({live=false}:{live?:boolean}) {
  const [info,setInfo]=useState<string|null>(null),[email,setEmail]=useState(""),[subscribing,setSubscribing]=useState(false),[notice,setNotice]=useState("");
  const dialogRef=useRef<HTMLElement>(null);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(""),5000);return()=>clearTimeout(timer)},[notice]);
  useEffect(()=>{
    if(!info)return;
    const previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const nodes=()=>Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])')||[]);
    nodes()[0]?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setInfo(null);if(e.key==="Tab"){const all=nodes(),first=all[0],last=all[all.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
    document.addEventListener("keydown",key);return()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",key);previous?.focus()};
  },[info]);
  async function subscribe(e:React.FormEvent){
    e.preventDefault();setSubscribing(true);
    try{const r=await fetch("/api/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,consent:true})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Please try again.");setNotice("You are subscribed. Thank you!");setEmail("")}catch(e){setNotice((e as Error).message)}finally{setSubscribing(false)}
  }
  return <>
    <div className="hp site-footer">
        <footer id="contact" className="hp-footer hp-container">
          <div className="hp-footer-grid">
            <div className="hp-contact">
              <a href="/" aria-label="Brande home">
                <img src="/brande-original.png" alt="Brande — Buy Branded with Brande.pk" />
              </a>
              <button onClick={() => setInfo("Contact us")}>
                <Mail />
                <span>brandifya@gmail.com</span>
              </button>
              <button onClick={() => setInfo("Contact us")}>
                <MapPin />
                <span>
                  29 SE 2nd Ave, Miami Florida
                  <br />
                  44041, United States
                </span>
              </button>
              <button onClick={() => setInfo("Contact us")}>
                <Phone />
                <span>(+92) 413 90 762</span>
              </button>
            </div>
            <div className="hp-footer-column">
              <h3>Shopping</h3>
              {[
                "Wishlist",
                "Shop by Brand",
                "Offers",
                "Track Order",
                "Size Guide",
              ].map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    if (x === "Wishlist") window.location.assign("/shop?saved=1");
                    else if (x === "Shop by Brand") window.location.assign("/#brands");
                    else if (x === "Offers") window.location.assign("/#deals");
                    else if (x === "Track Order") window.location.assign("/order");
                    else setInfo(x);
                  }}
                >
                  <ChevronRight size={15} />
                  {x}
                </button>
              ))}
            </div>
            <div className="hp-footer-column">
              <h3>Information</h3>
              {[
                "Track Order",
                "Shipping & Returns",
                "About Us",
                "Help",
                "Gift Cards",
              ].map((x) => (
                <button
                  key={x}
                  onClick={() =>
                    setInfo(
                      x === "Shipping & Returns"
                        ? "Shipping & returns"
                        : x === "About Us"
                          ? "About Brandifya"
                          : x === "Help"
                            ? "Contact us"
                            : x,
                    )
                  }
                >
                  <ChevronRight size={15} />
                  {x}
                </button>
              ))}
            </div>
            <div className="hp-newsletter">
              <h3>Subscribe.</h3>
              <p>Our conversation is just getting started</p>
              <form onSubmit={subscribe}>
                <div>
                  <input
                    aria-label="Your email"
                    type="email"
                    placeholder="Enter Your Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button disabled={subscribing}>
                    {subscribing ? "SENDING…" : "SUBSCRIBE"}
                  </button>
                </div>
              </form>
              <h4>Follow Us On</h4>
              <div className="hp-socials">
                {["f", "𝕏", "in", "v"].map((x) => (
                  <button
                    key={x}
                    aria-label={`Social profile ${x}`}
                    onClick={() => setInfo("Social profiles")}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="hp-footer-bottom">
            <p>
              All rights reserved — {new Date().getFullYear()} ©{" "}
              <strong>Brandifya</strong>
            </p>
            <Art
              name="payments"
              alt="PayPal, Visa, Mastercard, Apple Pay, Shop Pay, American Express"
            />
          </div>
          {!live && (
            <p className="hp-demo-note">
              Homepage design preview. Prices, ratings, promotions, contact
              details and service terms shown are sample content.
            </p>
          )}
        </footer>
    </div>
    {notice&&<div className="toast hp-toast" role="status" aria-live="polite"><Check size={18}/><span>{notice}</span></div>}
    {info&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setInfo(null)}}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="footer-info-title" ref={dialogRef}><button className="modal-close" aria-label="Close information" onClick={()=>setInfo(null)}><X/></button><span className="info-star">✳</span><h2 id="footer-info-title">{info}</h2><p>{policies[info]}</p><button className="primary" onClick={()=>setInfo(null)}>Got it<Check size={17}/></button></section></div>}
  </>;
}

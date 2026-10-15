"use client";
import Link from "next/link";
import { storeContact, storeContactMessage } from "../lib/store-contact";
import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, Phone, ChevronRight, X, Check } from "lucide-react";
const policies: Record<string,string> = {
  "Size Guide": "Product-specific measurements and fit guidance will be supplied with the final catalog.",
  "Gift Cards": "Gift cards are not currently available.",
  "Social profiles": "The store’s social profiles will be connected here.",
  "Track Order": "Your order reference is available on the order confirmation page. Customer order tracking is being configured.",
  "Shipping & returns": "Delivery areas, shipping fees, timelines, and return terms will be published once the merchant confirms them. Products cannot currently be ordered.",
  "About Brandifya": "Brandifya is a general-store concept bringing home, style, tech, and everyday essentials together. This storefront currently uses sample products and prices.",
  "Contact us": storeContactMessage,
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
              <a className="store-contact-link" href={`mailto:${storeContact.email}`}>
                <Mail /><span>{storeContact.email}</span>
              </a>
              <a className="store-contact-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeContact.address)}`} target="_blank" rel="noopener noreferrer">
                <MapPin /><span>{storeContact.address}</span>
              </a>
              <a className="store-contact-link" href={storeContact.phoneHref}>
                <Phone /><span>{storeContact.phone}</span>
              </a>
            </div>
            <div className="hp-footer-column">
              <h3>Shopping</h3>
              {[
                ["Shop All", "/shop"],
                ["Favorites", "/shop?saved=1"],
                ["Shop by Brand", "/#brands"],
                ["Offers", "/#deals"],
                ["Track Order", "/order-tracking"],
                ["Size Guide", "/size-guide"],
                ["Payments", "/payments"],
                ["FAQs", "/faq"],
              ].map(([label, href]) => <Link key={href} href={href}><ChevronRight size={15}/>{label}</Link>)}
            </div>
            <div className="hp-footer-column">
              <h3>Information</h3>
              {[
                ["Journal", "/blog"],
                ["About Us", "/about"],
                ["Contact Us", "/contact"],
                ["Shipping", "/shipping"],
                ["Returns & Refunds", "/returns"],
                ["Privacy Policy", "/privacy-policy"],
                ["Terms & Conditions", "/terms-and-conditions"],
                ["Cookies Policy", "/cookies-policy"],
              ].map(([label, href]) => <Link key={href} href={href}><ChevronRight size={15}/>{label}</Link>)}
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
            <div className="store-payment-logos" aria-label="Payment brands">
              {["visa", "mastercard", "easypaisa", "jazzcash", "payfast"].map((brand) => (
                <span key={brand} className={`store-payment-logo payment-${brand}`}>
                  <img src={`/payments/${brand === "easypaisa" ? "easypaisa-transparent" : brand}.${brand === "easypaisa" ? "webp" : brand === "jazzcash" || brand === "payfast" ? "png" : "svg"}`} alt={{visa:"Visa",mastercard:"MasterCard",easypaisa:"EasyPaisa",jazzcash:"JazzCash",payfast:"PayFast"}[brand]} width={brand === "payfast" ? 2048 : brand === "easypaisa" ? 400 : brand === "jazzcash" ? 320 : 90} height={brand === "payfast" ? 519 : brand === "easypaisa" ? 400 : brand === "jazzcash" ? 320 : 42} loading="lazy" />
                </span>
              ))}
            </div>
          </div>
          <p className="store-copyright">All rights reserved — {new Date().getFullYear()} © <strong>BrandE</strong></p>
        </footer>
    </div>
    {notice&&<div className="toast hp-toast" role="status" aria-live="polite"><Check size={18}/><span>{notice}</span></div>}
    {info&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setInfo(null)}}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="footer-info-title" ref={dialogRef}><button className="modal-close" aria-label="Close information" onClick={()=>setInfo(null)}><X/></button><span className="info-star">✳</span><h2 id="footer-info-title">{info}</h2><p>{policies[info]}</p><button className="primary" onClick={()=>setInfo(null)}>Got it<Check size={17}/></button></section></div>}
  </>;
}



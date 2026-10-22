import { storeContact } from "../../lib/store-contact";
import Link from "next/link";
import { Mail, Phone, MessageCircle, MessagesSquare, TriangleAlert, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SupportFrame from "../support-frame";
import { supportPages } from "../../lib/support-content";
export function generateStaticParams() { return supportPages.map(p=>({slug:p.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
  const {slug}=await params;const p=supportPages.find(p=>p.slug===slug);
  return p ? {title:p.title+" | Brande",description:p.description} : {};
}
export default async function SupportPage({params, searchParams}:{params:Promise<{slug:string}>; searchParams:Promise<{brand?:string | string[]}>}) {
  const {slug}=await params;const page=supportPages.find(p=>p.slug===slug);if(!page)notFound();
  const requestedBrand = slug === "contact" ? (await searchParams).brand : undefined;
  const brand = typeof requestedBrand === "string" ? requestedBrand.trim().slice(0, 80) : "";
  const inquirySubject = brand ? `Product / quotation request: ${brand}` : "";
  const policy=["privacy-policy","terms-and-conditions","cookies-policy","returns"].includes(slug);
  const helpSlugs = ["about", "terms-and-conditions", "faq", "cookies-policy", "shipping", "payments", "returns", "size-guide", "privacy-policy", "order-tracking"];
  const contactCards = [
    { title: "Email Us", copy: storeContact.email, href: "mailto:" + storeContact.email + (brand ? "?subject=" + encodeURIComponent(inquirySubject) : ""), icon: Mail, tone: "email" },
    { title: "Call Us", copy: storeContact.phone, href: storeContact.phoneHref, icon: Phone, tone: "phone" },
    { title: "WhatsApp Us", copy: "Chat with us on WhatsApp", href: "https://wa.me/923187553375", icon: MessageCircle, tone: "whatsapp" },
    { title: "Live Chat", copy: "Chat with our support team on WhatsApp", href: "https://wa.me/923187553375", icon: MessagesSquare, tone: "chat" },
    { title: "Submit a Complaint", copy: "Let us know your issue", href: "mailto:" + storeContact.email + "?subject=" + encodeURIComponent("Customer complaint"), icon: TriangleAlert, tone: "complaint" },
  ];
  return <SupportFrame>
    <nav className="commerce-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{page.title}</span></nav>
    <header className={slug === "contact" ? "support-contact-heading" : "support-hero"}><h1>{page.title}</h1><p>{slug === "contact" ? "Get in touch with us. We’re here to help!" : page.description}</p></header>
    {brand && <section className="commerce-panel"><h2>{brand} product enquiry</h2><p>Send us the product name, model or details you need from {brand}, and request a quotation. Our team will help you source your desired product.</p></section>}
    {policy&&<p className="support-note">Store preview · Policy details awaiting merchant confirmation.</p>}
    {slug === "contact" ? <section className="support-contact-cards" aria-label="Contact options">
      {contactCards.map(({ title, copy, href, icon: Icon, tone }) => <a key={title} className={`support-contact-card contact-${tone}`} href={href}>
        <span className="contact-card-icon"><Icon aria-hidden="true" /></span>
        <span><strong>{title}</strong><small>{copy}</small></span><ChevronRight className="contact-card-arrow" size={18} aria-hidden="true" />
      </a>)}
      <p className="support-contact-address"><strong>Visit us</strong><br />{storeContact.address}</p>
    </section> : <div className="support-layout">
      <aside className="support-index"><nav aria-label="On this page"><h2>On this page</h2>{page.sections.map((s,i)=><a key={s.title} href={"#section-"+i}>{s.title}</a>)}</nav></aside>
      <article className="support-article">{page.sections.map((s,i)=>slug==="faq"?<details className="support-faq" key={s.title} id={"section-"+i}><summary>{s.title}</summary><p>{s.text}</p></details>:<section key={s.title} id={"section-"+i}><h2>{s.title}</h2><p>{s.text}</p></section>)}
      {slug==="order-tracking"&&<Link className="commerce-primary support-action" href="/order">View order confirmation</Link>}
      </article>
    </div>}
    <section className="support-related"><h2>More help</h2><div>{helpSlugs.map(slug => supportPages.find(p => p.slug === slug)!).map(p=><Link key={p.slug} href={"/"+p.slug}>{p.title}<span aria-hidden="true">›</span></Link>)}</div></section>
  </SupportFrame>;
}


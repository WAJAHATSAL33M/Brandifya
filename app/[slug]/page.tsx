import { storeContact } from "../../lib/store-contact";
import Link from "next/link";
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
  return <SupportFrame>
    <nav className="commerce-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{page.title}</span></nav>
    <header className="support-hero"><h1>{page.title}</h1><p>{page.description}</p></header>
    {brand && <section className="commerce-panel"><h2>{brand} product enquiry</h2><p>Send us the product name, model or details you need from {brand}, and request a quotation. Our team will help you source your desired product.</p></section>}
    {policy&&<p className="support-note">Store preview · Policy details awaiting merchant confirmation.</p>}
    <div className="support-layout">
      <aside className="support-index"><nav aria-label="On this page"><h2>On this page</h2>{page.sections.map((s,i)=><a key={s.title} href={"#section-"+i}>{s.title}</a>)}</nav></aside>
      <article className="support-article">{page.sections.map((s,i)=>slug==="faq"?<details className="support-faq" key={s.title} id={"section-"+i}><summary>{s.title}</summary><p>{s.text}</p></details>:<section key={s.title} id={"section-"+i}><h2>{s.title}</h2><p>{s.text}</p></section>)}
      {slug==="contact"&&<div style={{display:"flex",flexWrap:"wrap",gap:12}}><a className="commerce-primary support-action" href={"mailto:"+storeContact.email+(brand ? "?subject="+encodeURIComponent(inquirySubject) : "")}>Email customer support</a><a className="commerce-primary support-action" href={storeContact.phoneHref}>Call customer support</a></div>}
      {slug==="order-tracking"&&<Link className="commerce-primary support-action" href="/order">View order confirmation</Link>}
      </article>
    </div>
    <section className="support-related"><h2>More help</h2><div>{supportPages.filter(p=>p.slug!==slug).map(p=><Link key={p.slug} href={"/"+p.slug}>{p.title}<span aria-hidden="true">↗</span></Link>)}</div></section>
  </SupportFrame>;
}


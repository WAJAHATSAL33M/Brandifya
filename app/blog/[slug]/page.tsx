import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SupportFrame from "../../support-frame";
import { posts } from "../../../lib/support-content";
export function generateStaticParams(){return posts.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=posts.find(p=>p.slug===slug);return p?{title:p.title+" | Brande Journal",description:p.description}:{};}
export default async function BlogPost({params}:{params:Promise<{slug:string}>}){
const {slug}=await params;const p=posts.find(p=>p.slug===slug);if(!p)notFound();
return <SupportFrame><nav className="commerce-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/blog">Journal</Link><span aria-hidden="true">/</span><span aria-current="page">{p.title}</span></nav>
<article><header className="support-hero support-post-heading"><h1>{p.title}</h1><p>{p.description}</p><small>By the Brande editorial team · {Math.max(2,Math.ceil(p.sections.map(s=>s.text).join(" ").split(/\s+/).length/200))} min read</small></header>
<img className="support-post-image" src={p.image} alt="" width={1200} height={500}/>
<div className="support-post-body">{p.sections.map(s=><section key={s.title}><h2>{s.title}</h2><p>{s.text}</p></section>)}<Link className="support-read" href="/blog">← Back to the journal</Link></div></article>
<section className="support-related"><h2>Keep reading</h2><div>{posts.filter(x=>x.slug!==p.slug).map(x=><Link key={x.slug} href={"/blog/"+x.slug}>{x.title}<span aria-hidden="true">↗</span></Link>)}</div></section>
</SupportFrame>;}

import Link from "next/link";
import type { Metadata } from "next";
import SupportFrame from "../support-frame";
import { posts } from "../../lib/support-content";
export const metadata:Metadata={title:"Journal | Brande",description:"Shopping ideas, useful checklists and inspiration for everyday home and style."};
export default function BlogArchive(){return <SupportFrame>
<nav className="commerce-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Journal</span></nav>
<header className="support-hero"><h1>The Brande Journal</h1><p>Useful ideas for your home, your style and your everyday routine.</p></header>
<div className="support-blog-grid">{posts.map(p=><article key={p.slug} className="support-blog-card"><Link href={"/blog/"+p.slug} aria-label={p.title}><img src={p.image} alt="" width={900} height={450}/></Link><div><small>{p.tag}</small><h2><Link href={"/blog/"+p.slug}>{p.title}</Link></h2><p>{p.description}</p><Link className="support-read" href={"/blog/"+p.slug}>Read the story <span aria-hidden="true">→</span></Link></div></article>)}</div>
<section className="support-shopping"><h2>Find something for your everyday.</h2><Link className="commerce-primary support-action" href="/shop">Explore the store</Link></section>
</SupportFrame>;}

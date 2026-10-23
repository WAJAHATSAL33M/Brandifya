import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SupportFrame from "../../support-frame";
import { publishedBlogs } from "../../../lib/blog";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = (await publishedBlogs()).find((p) => p.slug === slug);
  return p
    ? {
        title: (p.seo_title || p.title) + " | Brand E Journal",
        description: p.seo_description || p.excerpt,
      }
    : {};
}
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await publishedBlogs(),
    p = posts.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <SupportFrame>
      <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Journal</Link>
        <span>/</span>
        <span aria-current="page">{p.title}</span>
      </nav>
      <article>
        <header className="support-hero support-post-heading">
          <h1>{p.title}</h1>
          <p>{p.excerpt}</p>
          <small>
            By {p.author} ·{" "}
            {Math.max(
              1,
              Math.ceil(
                p.content.replace(/<[^>]*>/g, " ").split(/\s+/).length / 200,
              ),
            )}{" "}
            min read
          </small>
        </header>
        {p.cover_url && (
          <img
            className="support-post-image"
            src={p.cover_url}
            alt={p.cover_alt}
            width={1200}
            height={500}
          />
        )}
        <div className="support-post-body journal-rich-content">
          <div dangerouslySetInnerHTML={{ __html: p.content }} />
          <Link className="support-read" href="/blog">
            ← Back to the journal
          </Link>
        </div>
      </article>
      <section className="support-related">
        <h2>Keep reading</h2>
        <div>
          {posts
            .filter((x) => x.slug !== p.slug)
            .slice(0, 4)
            .map((x) => (
              <Link key={x.slug} href={"/blog/" + x.slug}>
                {x.title}
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
        </div>
      </section>
    </SupportFrame>
  );
}

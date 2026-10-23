import { db, databaseConfigured } from "./db";
import { posts as original } from "./support-content";
import { cleanBlogHtml } from "./blog-content";
const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export const originalBlogPosts = () =>
  original.map((p) => ({
    id: "",
    slug: p.slug,
    title: p.title,
    excerpt: p.description,
    content: p.sections
      .map((s) => "<h2>" + esc(s.title) + "</h2><p>" + esc(s.text) + "</p>")
      .join(""),
    cover_url: p.image,
    cover_alt: "",
    category: p.tag,
    tags: "",
    author: "Brand E editorial team",
    status: "published",
    publish_at: null,
    seo_title: "",
    seo_description: "",
    version: 0,
  }));
export type PublicBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  cover_alt: string;
  category: string;
  tags: string;
  author: string;
  status: string;
  publish_at: Date | string | null;
  seo_title: string;
  seo_description: string;
  version: number;
};
export async function publishedBlogs(): Promise<PublicBlog[]> {
  const base = originalBlogPosts();
  if (!databaseConfigured()) return base;
  const rows =
    await db()`SELECT * FROM blog_posts ORDER BY coalesce(publish_at,created_at) DESC`;
  const slugs = new Set(
    rows.flatMap((r) => [r.slug, r.origin_slug].filter(Boolean)),
  );
  const visible = rows
    .filter(
      (r) =>
        ["published", "scheduled"].includes(r.status) &&
        (!r.publish_at || new Date(r.publish_at).getTime() <= Date.now()),
    )
    .map((r) => ({ ...r, content: cleanBlogHtml(r.content) }) as PublicBlog);
  return [...visible, ...base.filter((p) => !slugs.has(p.slug))];
}

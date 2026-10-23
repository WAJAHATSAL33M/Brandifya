import { publishedBlogs } from "../../../lib/blog";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const posts = (await publishedBlogs())
      .slice(0, 6)
      .map((p) => ({
        title: p.title,
        slug: p.slug,
        image: p.cover_url,
        tag: p.category,
      }));
    return Response.json(
      { posts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Journal unavailable" }, { status: 503 });
  }
}

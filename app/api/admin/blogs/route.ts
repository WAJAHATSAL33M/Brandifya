import { randomUUID } from "node:crypto";
import { db } from "../../../../lib/db";
import { adminAuthorized, adminUser } from "../../../../lib/admin-auth";
import { validateBlog } from "../../../../lib/blog-content";
import { originalBlogPosts } from "../../../../lib/blog";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const rows = await db()`SELECT * FROM blog_posts WHERE id=${id}`;
      const revisions =
        await db()`SELECT id,actor,created_at,snapshot FROM blog_revisions WHERE post_id=${id} ORDER BY id DESC LIMIT 30`;
      return Response.json(
        {
          post: rows[0] || null,
          revisions: revisions.map((r) => ({
            ...r,
            snapshot:
              typeof r.snapshot === "string"
                ? JSON.parse(r.snapshot)
                : r.snapshot,
          })),
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const posts =
      await db()`SELECT id,slug,title,excerpt,cover_url,category,author,status,publish_at,updated_at,version FROM blog_posts ORDER BY updated_at DESC LIMIT 1000`;
    return Response.json(
      { posts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Journal unavailable. Apply database/admin-workspace.sql." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 250000) throw Error("Post is too large.");
    const b = JSON.parse(raw),
      actor = (await adminUser())!.username;
    if (b.action === "import") {
      await db().begin(async (sql) => {
        for (const p of originalBlogPosts())
          await sql`INSERT IGNORE INTO blog_posts(id,slug,origin_slug,title,excerpt,content,cover_url,cover_alt,category,tags,author,status,seo_title,seo_description) VALUES(${randomUUID()},${p.slug},${p.slug},${p.title},${p.excerpt},${p.content},${p.cover_url},'',${p.category},'',${p.author},'published','','')`;
      });
      return Response.json({ ok: true });
    }
    const p = validateBlog(b);
    if (b.action === "preview")
      return Response.json(
        { content: p.content },
        { headers: { "Cache-Control": "no-store" } },
      );
    const id = b.id ? String(b.id) : randomUUID();
    let version = 1;
    await db().begin(async (sql) => {
      if (b.id) {
        const rows =
          await sql`SELECT * FROM blog_posts WHERE id=${id} FOR UPDATE`;
        if (!rows.length) throw Error("Post not found.");
        if (Number(rows[0].version) !== Number(b.version))
          throw Error(
            "This post changed in another session. Reopen it before saving.",
          );
        await sql`INSERT INTO blog_revisions(post_id,snapshot,actor) VALUES(${id},${sql.json(rows[0])},${actor})`;
        version = Number(rows[0].version) + 1;
      }
      if (!b.id)
        await sql`INSERT INTO blog_posts(id,slug,origin_slug,title,excerpt,content,cover_url,cover_alt,category,tags,author,status,publish_at,seo_title,seo_description,version) VALUES(${id},${p.slug},${originalBlogPosts().some((o) => o.slug === p.slug) ? p.slug : null},${p.title},${p.excerpt},${p.content},${p.coverUrl},${p.coverAlt},${p.category},${p.tags},${p.author},${p.status},${p.publishAt},${p.seoTitle},${p.seoDescription},${version})`;
      await sql`UPDATE blog_posts SET slug=${p.slug},title=${p.title},excerpt=${p.excerpt},content=${p.content},cover_url=${p.coverUrl},cover_alt=${p.coverAlt},category=${p.category},tags=${p.tags},author=${p.author},status=${p.status},publish_at=${p.publishAt},seo_title=${p.seoTitle},seo_description=${p.seoDescription},version=${version},updated_at=now() WHERE id=${id}`;
    });
    return Response.json({ ok: true, id, version });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Post could not be saved. Check database schema and unique slug.",
      },
      { status: 400 },
    );
  }
}

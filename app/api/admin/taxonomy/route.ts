import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/admin-auth";
import { integer, text } from "../../../../lib/admin-input";
import { categorySlug } from "../../../../lib/categories";
import { safeMediaUrl } from "../../../../lib/auth-core";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const terms =
      await db()`SELECT t.*,(SELECT count(*) FROM product_details d WHERE d.category_id=t.id OR d.brand_id=t.id OR JSON_CONTAINS(d.tag_ids,CAST(t.id AS CHAR),'$')) AS product_count FROM catalog_terms t ORDER BY t.kind,t.name`;
    const categories =
      await db()`SELECT DISTINCT category FROM products ORDER BY category`;
    return Response.json(
      { terms, existingCategories: categories.map((c) => c.category) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Catalog setup is incomplete. Open Settings and finish database setup.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (b.action === "importCategories") {
      await db().begin(async (sql) => {
        await sql.lock("catalog-write");
        const names =
          await sql`SELECT DISTINCT category FROM products WHERE category!=''`;
        for (const c of names) {
          const slug = categorySlug(c.category);
          if (!slug) continue;
          await sql`INSERT IGNORE INTO catalog_terms(kind,name,slug,description) VALUES('category',${c.category},${slug},'')`;
        }
        await sql`INSERT INTO product_details(product_id,category_id,tag_ids,status) SELECT p.id,t.id,'[]',CASE WHEN p.active THEN 'active' ELSE 'draft' END FROM products p JOIN catalog_terms t ON t.kind='category' AND t.name=p.category ON DUPLICATE KEY UPDATE category_id=VALUES(category_id)`;
      });
      return Response.json({ ok: true });
    }
    const kind = text(b.kind, "type", 16, true);
    if (!["category", "brand", "tag"].includes(kind))
      throw Error("Invalid catalog type.");
    const name = text(b.name, "name", 100, true),
      slug = text(b.slug, "slug", 140, true),
      description = text(b.description || "", "description", 4000),
      image = text(b.image || "", "image URL", 2048);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw Error("Use a lowercase slug with hyphens.");
    if (image && !safeMediaUrl(image))
      throw Error("Use an HTTPS image URL or a local image path.");
    if (typeof b.active !== "boolean") throw Error("Invalid visibility.");
    await db().begin(async (sql) => {
      await sql.lock("catalog-write");
      if (b.id) {
        const id = integer(b.id, "record", 1),
          rows =
            await sql`SELECT name FROM catalog_terms WHERE id=${id} AND kind=${kind} FOR UPDATE`;
        if (!rows.length) throw Error("Record not found.");
        if (kind === "category" && rows[0].name !== name) {
          await sql`UPDATE products SET category=${name} WHERE category=${rows[0].name}`;
        }
        await sql`UPDATE catalog_terms SET name=${name},slug=${slug},description=${description},image=${image},active=${b.active} WHERE id=${id} AND kind=${kind}`;
      } else
        await sql`INSERT INTO catalog_terms(kind,name,slug,description,image,active) VALUES(${kind},${name},${slug},${description},${image},${b.active})`;
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Could not save. Names and slugs must be unique within their type.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json(),
      id = integer(b.id, "record", 1);
    await db().begin(async (sql) => {
      await sql.lock("catalog-write");
      const rows =
        await sql`SELECT kind,name FROM catalog_terms WHERE id=${id} FOR UPDATE`;
      if (!rows.length) throw Error("Record not found.");
      const used =
        await sql`SELECT product_id FROM product_details WHERE category_id=${id} OR brand_id=${id} OR JSON_CONTAINS(tag_ids,${String(id)},'$') LIMIT 1`;
      const legacy =
        rows[0].kind === "category"
          ? await sql`SELECT id FROM products WHERE category=${rows[0].name} LIMIT 1`
          : [];
      if (used.length || legacy.length)
        throw Error(
          "This record is assigned to products. Reassign them first, or archive the record.",
        );
      await sql`DELETE FROM catalog_terms WHERE id=${id}`;
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Record could not be deleted.",
      },
      { status: 400 },
    );
  }
}

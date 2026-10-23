import { db } from "../../../../../lib/db";
import { adminAuthorized } from "../../../../../lib/admin-auth";
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (
      !Array.isArray(b.ids) ||
      !b.ids.length ||
      b.ids.length > 100 ||
      b.ids.some(
        (id: unknown) => !Number.isSafeInteger(id) || Number(id) < 1,
      ) ||
      !["active", "draft", "archived"].includes(b.status)
    )
      throw Error("Select 1–100 valid products and a status.");
    const ids = [...new Set<number>(b.ids)].sort((a, b) => a - b);
    await db().begin(async (sql) => {
      await sql.lock("catalog-write");
      for (const id of ids) {
        const rows =
          await sql`SELECT id,price_minor,image FROM products WHERE id=${id} FOR UPDATE`;
        if (!rows.length) throw Error("A selected product no longer exists.");
        if (
          b.status === "active" &&
          (!rows[0].image || rows[0].price_minor <= 0)
        )
          throw Error(
            "A product needs an image and valid price before publishing.",
          );
        await sql`UPDATE products SET active=${b.status === "active"} WHERE id=${id}`;
        await sql`INSERT INTO product_details(product_id,tag_ids,status) VALUES(${id},'[]',${b.status}) ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=now()`;
      }
    });
    return Response.json({ ok: true, count: ids.length });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error && !/database|mysql/i.test(e.message)
            ? e.message
            : "Bulk update failed. Check database setup.",
      },
      { status: 400 },
    );
  }
}

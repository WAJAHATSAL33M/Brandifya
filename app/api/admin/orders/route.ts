import { timingSafeEqual } from "node:crypto";
import { db } from "../../../../lib/db";
function authorized(request: Request) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || token.length < 32) return false;
  const a = Buffer.from(request.headers.get("authorization") || ""),
    b = Buffer.from(`Bearer ${token}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function GET(request: Request) {
  if (!authorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const orders =
      await db()`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`;
    return Response.json(
      { orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!authorized(request))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (
      !/^[a-f0-9-]{36}$/i.test(body.id) ||
      !["processing", "shipped", "delivered"].includes(body.status)
    )
      return Response.json({ error: "Invalid update" }, { status: 400 });
    const previous: Record<string, string[]> = {
      processing: ["confirmed", "paid"],
      shipped: ["processing"],
      delivered: ["shipped"],
    };
    const result =
      await db()`UPDATE orders SET status=${body.status},updated_at=now() WHERE id=${body.id} AND status IN ${db()(previous[body.status])} RETURNING id,status`;
    return result.length
      ? Response.json(result[0])
      : Response.json(
          { error: "Order not found or invalid status transition" },
          { status: 409 },
        );
  } catch {
    return Response.json({ error: "Update failed" }, { status: 503 });
  }
}

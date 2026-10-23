import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/auth";
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const offset = Math.max(
      0,
      Math.floor(Number(new URL(request.url).searchParams.get("offset")) || 0),
    );
    const rows =
      await db()`SELECT c.id,c.name,c.email,c.email_verified,c.phone,c.address,c.city,c.postal_code,c.country,c.created_at,(SELECT count(*) FROM orders o WHERE o.customer_id=c.id) AS order_count FROM customers c ORDER BY c.created_at DESC LIMIT 100 OFFSET ${offset}`;
    return Response.json(
      { customers: rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Customers unavailable." }, { status: 503 });
  }
}

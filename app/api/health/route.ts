import { db, databaseConfigured } from "../../../lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (!databaseConfigured())
    return Response.json(
      { ok: false, database: "not-configured" },
      { status: 503, headers },
    );
  try {
    await db()`SELECT id FROM products LIMIT 1`;
    await db()`SELECT id FROM customers LIMIT 1`;
    await db()`SELECT id FROM orders LIMIT 1`;
    await db()`SELECT lock_key FROM transaction_locks LIMIT 1`;
    await db()`SELECT id FROM order_notifications LIMIT 1`;
    return Response.json({ ok: true, database: "connected" }, { headers });
  } catch {
    return Response.json(
      { ok: false, database: "unavailable" },
      { status: 503, headers },
    );
  }
}

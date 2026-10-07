import { db } from "../../../lib/db";
export async function GET(request: Request) {
  const session = new URL(request.url).searchParams.get("session_id");
  if (!session || !/^cs_[a-zA-Z0-9_]{10,250}$/.test(session))
    return Response.json({ error: "Invalid session" }, { status: 400 });
  try {
    const orders =
      await db()`SELECT id,status FROM orders WHERE stripe_session_id=${session}`;
    if (!orders.length)
      return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json(
      { id: orders[0].id, status: orders[0].status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Order status unavailable" },
      { status: 503 },
    );
  }
}

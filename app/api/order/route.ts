import { db } from "../../../lib/db";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams,
    session = params.get("session_id"),
    id = params.get("order_id"),
    key = request.headers.get("X-Order-Key");
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    session
      ? !/^cs_[a-zA-Z0-9_]{10,250}$/.test(session)
      : !(id && key && uuid.test(id) && uuid.test(key))
  )
    return Response.json(
      { error: "Order verification is required." },
      { status: 400 },
    );
  try {
    const sql = db(),
      orders = session
        ? await sql`SELECT id,status,payment_method,currency,total_minor,shipping_minor,customer,created_at FROM orders WHERE stripe_session_id=${session}`
        : await sql`SELECT id,status,payment_method,currency,total_minor,shipping_minor,customer,created_at FROM orders WHERE id=${id!} AND request_key=${key!}`;
    if (!orders.length)
      return Response.json({ error: "Order not found." }, { status: 404 });
    const order = orders[0],
      items =
        await sql`SELECT i.product_id AS id,i.name,i.price_minor,i.quantity,p.image,p.color FROM order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.order_id=${order.id} ORDER BY i.product_id`;
    return Response.json(
      {
        id: order.id,
        status: order.status,
        paymentMethod: order.payment_method,
        currency: order.currency,
        totalMinor: order.total_minor,
        shippingMinor: order.shipping_minor,
        customer: order.customer,
        createdAt: order.created_at,
        items,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Order status is temporarily unavailable." },
      { status: 503 },
    );
  }
}

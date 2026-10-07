import postgres from "postgres";
let connection: ReturnType<typeof postgres> | undefined;
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("Store database is not configured.");
  return (connection ??= postgres(process.env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  }));
}
export async function cancelOrder(id: string) {
  await db().begin(async (sql) => {
    const orders =
      await sql`UPDATE orders SET status='cancelled', updated_at=now() WHERE id=${id} AND status='awaiting_payment' RETURNING id`;
    if (orders.length) {
      const items =
        await sql`SELECT product_id,quantity FROM order_items WHERE order_id=${id}`;
      for (const item of items)
        await sql`UPDATE products SET stock=stock+${item.quantity} WHERE id=${item.product_id}`;
    }
  });
}

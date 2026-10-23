import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { createHash } from "node:crypto";
import { databaseOptions } from "./database-config.mjs";
export { databaseConfigured } from "./database-config.mjs";
type Rows = RowDataPacket[] & { count: number };
export interface StoreSql {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Rows>;
  begin<T>(callback: (sql: StoreSql) => Promise<T>): Promise<T>;
  lock(key: string): Promise<void>;
  json(value: unknown): string;
}
let pool: Pool | undefined;
let connection: StoreSql | undefined;
function getPool() {
  if (!pool) {
    pool = mysql.createPool(databaseOptions());
    pool.on("connection", client => { client.query("SET time_zone = '+00:00'"); });
  }
  return pool;
}
function sqlFor(transaction?: PoolConnection): StoreSql {
  const query = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    try {
      const [result] = await (transaction || getPool()).execute(strings.join("?"), values.map(v => {
        if (v === undefined || v === null) return null;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v instanceof Date || Buffer.isBuffer(v)) return v;
        throw new Error("Unsupported database parameter. Serialize JSON explicitly.");
      }));
      if (!Array.isArray(result)) return Object.assign([], { count: (result as ResultSetHeader).affectedRows }) as Rows;
      const rows = result as RowDataPacket[];
      for (const row of rows) {
        for (const key of ["active", "promotion_active", "email_verified"]) if (key in row) row[key] = row[key] === true || row[key] === 1;
        for (const key of ["customer", "media", "attributes"]) if (typeof row[key] === "string") row[key] = JSON.parse(row[key]);
        for (const key of ["count", "total", "today", "pending", "order_count"]) if (key in row) row[key] = Number(row[key]);
      }
      return Object.assign(rows, { count: rows.length }) as Rows;
    } catch (cause) { throw new Error("Database operation failed. Check database configuration and schema.", { cause }); }
  }) as StoreSql;
  query.json = value => JSON.stringify(value);
  query.lock = async key => {
    if (!transaction) throw new Error("Database locks require a transaction.");
    const id = createHash("sha256").update(key).digest("hex");
    await query`INSERT INTO transaction_locks (lock_key) VALUES (${id}) ON DUPLICATE KEY UPDATE lock_key=lock_key`;
    await query`SELECT lock_key FROM transaction_locks WHERE lock_key=${id} FOR UPDATE`;
  };
  query.begin = async callback => {
    if (transaction) throw new Error("Nested transactions are not supported.");
    const client = await getPool().getConnection().catch(cause => {
      throw new Error("Database connection failed. Check database configuration.", { cause });
    });
    try {
      await client.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
      await client.beginTransaction();
      const result = await callback(sqlFor(client));
      await client.commit();
      return result;
    } catch (error) {
      await client.rollback().catch(() => {});
      if (error && typeof error === "object" && "sqlState" in error) throw new Error("Database transaction failed.", { cause: error });
      throw error;
    }
    finally { client.release(); }
  };
  return query;
}
export function db(): StoreSql { return connection ??= sqlFor(); }
export async function closeDatabase() { if (pool) await pool.end(); pool = undefined; connection = undefined; }
export async function cancelOrder(id: string) {
  await db().begin(async sql => {
    const orders = await sql`SELECT id FROM orders WHERE id=${id} AND status='awaiting_payment' FOR UPDATE`;
    if (!orders.length) return;
    await sql`UPDATE orders SET status='cancelled', updated_at=now() WHERE id=${id} AND status='awaiting_payment'`;
    await sql`INSERT INTO order_events(order_id,status) VALUES(${id},'cancelled')`;
    const items = await sql`SELECT product_id,quantity FROM order_items WHERE order_id=${id} ORDER BY product_id`;
    for (const item of items) {
      await sql`UPDATE products SET stock=stock+${item.quantity} WHERE id=${item.product_id}`;
      const balance=await sql`SELECT stock FROM products WHERE id=${item.product_id}`;
      await sql`INSERT INTO inventory_movements(product_id,delta,stock_after,reason,reference,actor) VALUES(${item.product_id},${item.quantity},${balance[0].stock},'Payment cancelled / expired',${id},'checkout')`;
    }
  });
}

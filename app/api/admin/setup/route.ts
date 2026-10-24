import mysql from "mysql2/promise";
import { db } from "../../../../lib/db";
import { databaseOptions } from "../../../../lib/database-config.mjs";
import { adminAuthorized, adminUser } from "../../../../lib/admin-auth";
import { adminSchemaStatements } from "../../../../lib/admin-schema";
import { rateLimit } from "../../../../lib/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function readiness() {
  const groups = await Promise.all([
    (async () => {
      try {
        await db()`SELECT id FROM products LIMIT 1`;
        await db()`SELECT id FROM orders LIMIT 1`;
        return { name: "Core store", ready: true };
      } catch {
        return { name: "Core store", ready: false };
      }
    })(),
    (async () => {
      try {
        await db()`SELECT product_id FROM product_inventory LIMIT 1`;
        await db()`SELECT id FROM inventory_movements LIMIT 1`;
        await db()`SELECT id FROM purchase_orders LIMIT 1`;
        await db()`SELECT purchase_id FROM purchase_order_items LIMIT 1`;
        await db()`SELECT id FROM order_notes LIMIT 1`;
        await db()`SELECT id FROM order_notifications LIMIT 1`;
        return { name: "Inventory & orders", ready: true };
      } catch {
        return { name: "Inventory & orders", ready: false };
      }
    })(),
    (async () => {
      try {
        await db()`SELECT id,origin_slug FROM blog_posts LIMIT 1`;
        await db()`SELECT id FROM blog_revisions LIMIT 1`;
        return { name: "Blogs & editor", ready: true };
      } catch {
        return { name: "Blogs & editor", ready: false };
      }
    })(),
    (async () => {
      try {
        await db()`SELECT id FROM catalog_terms LIMIT 1`;
        await db()`SELECT product_id FROM product_details LIMIT 1`;
        return { name: "Categories, brands & tags", ready: true };
      } catch {
        return { name: "Categories, brands & tags", ready: false };
      }
    })(),
  ]);
  return {
    ready: groups.every((g) => g.ready),
    groups,
    version: "admin-2026-10-24",
  };
}
export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await readiness(), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if ((await adminUser())?.role !== "owner")
    return Response.json(
      { error: "Ask the store owner to finish database setup." },
      { status: 403 },
    );
  try {
    await rateLimit("admin-schema-setup", 5);
    const connection = await mysql.createConnection(databaseOptions());
    try {
      for (const sql of adminSchemaStatements) await connection.query(sql);
    } finally {
      await connection.end();
    }
    return Response.json(await readiness(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Setup could not finish. Import database/admin-workspace.sql, database/admin-catalog.sql and database/order-processing.sql in phpMyAdmin, then check setup again.",
      },
      { status: 503 },
    );
  }
}

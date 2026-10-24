// Run only against a dedicated, disposable MySQL database ending _test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, closeDatabase } from "../lib/db.ts";
import {
  queueOrderNotification,
  sendOrderNotifications,
} from "../lib/order-notifications.ts";
test("order notifications recover immediately after failure, preserve orders and deduplicate concurrent sends", async () => {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw Error("Dedicated _test database required.");
  process.env.RESEND_API_KEY = "qa-fake-key";
  process.env.AUTH_FROM_EMAIL = "Brand E <orders@example.com>";
  process.env.STORE_URL = "https://store.example";
  const sql = db(),
    id = randomUUID(),
    requestKey = randomUUID(),
    requests: { key: string | null; body: Record<string, unknown> }[] = [],
    original = globalThis.fetch;
  let fail = true;
  globalThis.fetch = (async (input, init) => {
    assert.equal(String(input), "https://api.resend.com/emails");
    requests.push({
      key: new Headers(init?.headers).get("Idempotency-Key"),
      body: JSON.parse(String(init?.body)),
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    return new Response(
      JSON.stringify(fail ? { error: "simulated outage" } : { id: "qa-mail" }),
      {
        status: fail ? 503 : 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;
  try {
    await sql`INSERT INTO orders(id,request_key,request_fingerprint,status,payment_method,currency,total_minor,shipping_minor,customer) VALUES(${id},${requestKey},${"a".repeat(64)},'confirmed','cod','PKR',10000,0,${sql.json({ name: "Notification QA", email: "Customer@Example.com" })})`;
    await sql.begin(async (tx) => {
      await queueOrderNotification(tx, id, "confirmed");
      await queueOrderNotification(tx, id, "confirmed");
    });
    assert.equal(
      (
        await sql`SELECT COUNT(*) AS count FROM order_notifications WHERE order_id=${id}`
      )[0].count,
      1,
    );
    const failed = await sendOrderNotifications();
    assert.equal(failed.failed, 1);
    assert.equal(failed.sent, 0);
    assert.equal(
      (await sql`SELECT status FROM orders WHERE id=${id}`)[0].status,
      "confirmed",
    );
    assert.equal((await sendOrderNotifications()).failed, 0);
    assert.equal(requests.length, 1);
    await sql`UPDATE order_notifications SET attempts=0,available_at=now(3) WHERE order_id=${id}`;
    fail = false;
    assert.equal((await sendOrderNotifications()).sent, 1);
    assert.equal((await sendOrderNotifications()).sent, 0);
    assert.equal(requests[0].key, requests[1].key);
    assert.deepEqual(requests[1].body.to, ["customer@example.com"]);
    assert.ok(!String(requests[1].body.text).includes(requestKey));
    await sql.begin((tx) => queueOrderNotification(tx, id, "processing"));
    process.env.RESEND_API_KEY = "";
    assert.equal((await sendOrderNotifications()).configured, false);
    process.env.RESEND_API_KEY = "qa-fake-key";
    const concurrent = await Promise.all([
      sendOrderNotifications(1),
      sendOrderNotifications(1),
    ]);
    assert.equal(
      concurrent.reduce((n, r) => n + r.sent, 0),
      1,
    );
    assert.equal(requests.length, 3);
    assert.equal(
      (
        await sql`SELECT COUNT(*) AS count FROM order_notifications WHERE order_id=${id} AND sent_at IS NOT NULL`
      )[0].count,
      2,
    );
  } finally {
    globalThis.fetch = original;
    await sql`DELETE FROM order_notifications WHERE order_id=${id}`;
    await sql`DELETE FROM orders WHERE id=${id}`;
    await closeDatabase();
  }
});

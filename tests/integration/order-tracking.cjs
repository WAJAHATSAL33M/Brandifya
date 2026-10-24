const assert = require("node:assert/strict"),
  { randomUUID } = require("node:crypto");
module.exports = async function trackingTests(
  origin,
  conn,
  admin,
  userHeaders,
  orderId,
  requestKey,
) {
  const base = { "Content-Type": "application/json", Origin: origin };
  async function lookup(body, headers = {}) {
    const r = await fetch(origin + "/api/order-tracking", {
      method: "POST",
      headers: { ...base, ...headers },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json(), headers: r.headers };
  }
  assert.equal((await lookup({ id: orderId })).status, 404);
  assert.equal(
    (await lookup({ id: orderId, contact: "wrong@example.com" })).status,
    404,
  );
  assert.equal(
    (await lookup({ id: randomUUID(), contact: "wrong@example.com" })).status,
    404,
  );
  assert.equal(
    (await lookup({ id: "short", contact: "+923187553375" })).status,
    400,
  );
  assert.equal(
    (
      await lookup(
        { id: orderId, contact: "+923187553375" },
        { Origin: "https://attacker.example" },
      )
    ).status,
    403,
  );
  const phone = await lookup({ id: orderId, contact: "0318-7553375" });
  assert.equal(phone.status, 200);
  assert.equal(phone.body.order.id, orderId);
  assert.equal(phone.body.order.customer, undefined);
  assert.equal(phone.body.order.request_key, undefined);
  assert.equal(phone.body.order.customer_id, undefined);
  assert.equal(phone.body.order.items[0].product_id, undefined);
  assert.match(phone.headers.get("cache-control"), /no-store/);
  assert.equal((await lookup({ id: orderId, key: requestKey })).status, 200);
  assert.equal((await lookup({ id: orderId }, userHeaders)).status, 200);
  const [initial] = await conn.query("SELECT customer FROM orders WHERE id=?", [
    orderId,
  ]);
  const customer =
    typeof initial[0].customer === "string"
      ? JSON.parse(initial[0].customer)
      : initial[0].customer;
  await conn.query("UPDATE orders SET customer=? WHERE id=?", [
    JSON.stringify({ ...customer, email: "Track@Example.com" }),
    orderId,
  ]);
  assert.equal(
    (await lookup({ id: orderId, contact: "track@EXAMPLE.COM" })).status,
    200,
  );
  const patch = await fetch(origin + "/api/admin/orders", {
    method: "PATCH",
    headers: admin,
    body: JSON.stringify({
      id: orderId,
      status: "shipped",
      trackingNumber: "TRACK-QA-123",
      trackingUrl: "https://courier.example/track/TRACK-QA-123",
    }),
  });
  assert.equal(patch.status, 200, await patch.text());
  const shipped = await lookup({ id: orderId, contact: "+92 318 7553375" });
  assert.equal(shipped.body.order.status, "shipped");
  assert.equal(shipped.body.order.trackingNumber, "TRACK-QA-123");
  assert.equal(
    shipped.body.order.trackingUrl,
    "https://courier.example/track/TRACK-QA-123",
  );
  assert.ok(shipped.body.order.events.some((e) => e.status === "shipped"));
  await conn.query(
    "UPDATE orders SET tracking_url='javascript:alert(1)' WHERE id=?",
    [orderId],
  );
  assert.equal(
    (await lookup({ id: orderId, key: requestKey })).body.order.trackingUrl,
    "",
  );
  await conn.query(
    "UPDATE orders SET status='processing',tracking_url='https://courier.example/track/TRACK-QA-123',customer=? WHERE id=?",
    [JSON.stringify(customer), orderId],
  );
  // Read-only order lookup cannot bypass ownership using another signed-in account.
  const otherId = randomUUID();
  await conn.query(
    "INSERT INTO customers(id,name,email,email_verified) VALUES(?,'Other customer',?,true)",
    [otherId, "other-" + otherId + "@example.com"],
  );
  const otherToken = require("node:crypto")
      .randomBytes(32)
      .toString("base64url"),
    hash = require("node:crypto")
      .createHash("sha256")
      .update(otherToken)
      .digest("hex");
  await conn.query(
    "INSERT INTO customer_sessions(token_hash,customer_id,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 1 HOUR))",
    [hash, otherId],
  );
  assert.equal(
    (await lookup({ id: orderId }, { Cookie: "brande-session=" + otherToken }))
      .status,
    404,
  );
  const nonexistent = randomUUID();
  for (let i = 0; i < 30; i++)
    assert.equal(
      (await lookup({ id: nonexistent, contact: "03187553375" })).status,
      404,
    );
  assert.equal(
    (await lookup({ id: nonexistent, contact: "03187553375" })).status,
    429,
  );
  console.log(
    "PASS tracking: guest phone/email/private confirmation, account ownership isolation, admin shipment updates and timeline, no personal data/key leakage, safe carrier URLs, invalid input/origin and lookup rate limits",
  );
};

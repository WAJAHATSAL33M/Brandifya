const assert = require("node:assert/strict"),
  { randomUUID, createHmac } = require("node:crypto");
module.exports = async function (origin, conn, admin, product, secret) {
  await conn.query("UPDATE products SET active=true,stock=20 WHERE id=?", [
    product,
  ]);
  const [products] = await conn.query(
    "SELECT price_minor FROM products WHERE id=?",
    [product],
  );
  const price = products[0].price_minor;
  const headers = { "Content-Type": "application/json", Origin: origin };
  const customer = {
    name: "Order Workflow QA",
    phone: "+923187553375",
    email: "orders-qa@example.com",
    address: "Test address",
    city: "Islamabad",
    postalCode: "44000",
    country: "PK",
  };
  async function checkout(key, email = true) {
    const r = await fetch(origin + "/api/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({
        requestKey: key,
        method: "cod",
        items: [{ id: product, quantity: 1 }],
        customer: { ...customer, ...(!email ? { email: "" } : {}) },
      }),
    });
    return { status: r.status, body: await r.json() };
  }
  async function update(id, body) {
    return fetch(origin + "/api/admin/orders", {
      method: "PATCH",
      headers: admin,
      body: JSON.stringify({ id, ...body }),
    });
  }
  const key = randomUUID(),
    placed = await checkout(key);
  assert.equal(placed.status, 200, JSON.stringify(placed.body));
  const id = placed.body.orderId;
  const repeats = await Promise.all(
    Array.from({ length: 4 }, () => checkout(key)),
  );
  assert.ok(repeats.every((r) => r.body.orderId === id));
  assert.equal(
    (
      await conn.query(
        "SELECT COUNT(*) n FROM order_events WHERE order_id=? AND status='confirmed'",
        [id],
      )
    )[0][0].n,
    1,
  );
  assert.equal(
    (
      await conn.query(
        "SELECT COUNT(*) n FROM order_notifications WHERE order_id=?",
        [id],
      )
    )[0][0].n,
    1,
  );
  for (const status of ["processing", "shipped", "delivered"]) {
    const r = await update(id, {
      status,
      ...(status === "shipped"
        ? {
            trackingNumber: "SHIP-QA",
            trackingUrl: "https://courier.example/SHIP-QA",
          }
        : {}),
    });
    assert.equal(r.status, 200, await r.text());
  }
  assert.equal(
    (
      await conn.query("SELECT COUNT(*) n FROM order_events WHERE order_id=?", [
        id,
      ])
    )[0][0].n,
    4,
  );
  assert.equal(
    (
      await conn.query(
        "SELECT COUNT(*) n FROM order_notifications WHERE order_id=?",
        [id],
      )
    )[0][0].n,
    4,
  );
  assert.equal((await update(id, { status: "cancelled" })).status, 400);
  const cancelledKey = randomUUID(),
    cancelled = await checkout(cancelledKey),
    cancelId = cancelled.body.orderId;
  const stockBefore = (
    await conn.query("SELECT stock FROM products WHERE id=?", [product])
  )[0][0].stock;
  const cancellations = await Promise.all([
    update(cancelId, { status: "cancelled" }),
    update(cancelId, { status: "cancelled" }),
  ]);
  assert.deepEqual(cancellations.map((r) => r.status).sort(), [200, 400]);
  assert.equal(
    (await conn.query("SELECT stock FROM products WHERE id=?", [product]))[0][0]
      .stock,
    stockBefore + 1,
  );
  assert.equal((await checkout(cancelledKey)).status, 409);
  const noEmail = await checkout(randomUUID(), false);
  assert.equal(noEmail.status, 200);
  assert.equal(
    (
      await conn.query(
        "SELECT COUNT(*) n FROM order_notifications WHERE order_id=?",
        [noEmail.body.orderId],
      )
    )[0][0].n,
    0,
  );
  async function pending() {
    const id = randomUUID(),
      session = "cs_test_" + randomUUID().replaceAll("-", "");
    await conn.query(
      "INSERT INTO orders(id,request_key,request_fingerprint,status,payment_method,currency,total_minor,shipping_minor,customer,stripe_session_id) VALUES(?,?,?,'awaiting_payment','stripe','PKR',?,0,?,?)",
      [
        id,
        randomUUID(),
        "f".repeat(64),
        price,
        JSON.stringify(customer),
        session,
      ],
    );
    await conn.query(
      "INSERT INTO order_items(order_id,product_id,name,price_minor,quantity) VALUES(?,?,'Workflow QA',?,1)",
      [id, product, price],
    );
    await conn.query("UPDATE products SET stock=stock-1 WHERE id=?", [product]);
    return { id, session };
  }
  async function webhook(order, type, overrides = {}, valid = true) {
    const body = JSON.stringify({
      type,
      data: {
        object: {
          id: order.session,
          metadata: { order_id: order.id },
          payment_status: "paid",
          currency: "pkr",
          amount_total: price,
          ...overrides,
        },
      },
    });
    const timestamp = Math.floor(Date.now() / 1000),
      signature = createHmac("sha256", valid ? secret : "wrong-secret")
        .update(timestamp + "." + body)
        .digest("hex");
    return fetch(origin + "/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": `t=${timestamp},v1=${signature}`,
      },
      body,
    });
  }
  const paid = await pending();
  assert.equal(
    (await webhook(paid, "checkout.session.completed", {}, false)).status,
    400,
  );
  await webhook(paid, "checkout.session.completed", {
    amount_total: price + 1,
  });
  await webhook(paid, "checkout.session.completed", {
    id: "cs_test_wrong_session",
  });
  assert.equal(
    (await conn.query("SELECT status FROM orders WHERE id=?", [paid.id]))[0][0]
      .status,
    "awaiting_payment",
  );
  await Promise.all(
    Array.from({ length: 4 }, () =>
      webhook(paid, "checkout.session.completed"),
    ),
  );
  assert.equal(
    (await conn.query("SELECT status FROM orders WHERE id=?", [paid.id]))[0][0]
      .status,
    "paid",
  );
  assert.equal(
    (
      await conn.query(
        "SELECT COUNT(*) n FROM order_events WHERE order_id=? AND status='paid'",
        [paid.id],
      )
    )[0][0].n,
    1,
  );
  assert.equal(
    (
      await conn.query(
        "SELECT COUNT(*) n FROM order_notifications WHERE order_id=?",
        [paid.id],
      )
    )[0][0].n,
    1,
  );
  await webhook(paid, "checkout.session.expired");
  assert.equal(
    (await conn.query("SELECT status FROM orders WHERE id=?", [paid.id]))[0][0]
      .status,
    "paid",
  );
  const expired = await pending(),
    expiryStock = (
      await conn.query("SELECT stock FROM products WHERE id=?", [product])
    )[0][0].stock;
  await webhook(expired, "checkout.session.expired", {
    id: "cs_test_wrong_session",
  });
  assert.equal(
    (
      await conn.query("SELECT status FROM orders WHERE id=?", [expired.id])
    )[0][0].status,
    "awaiting_payment",
  );
  await Promise.all([
    webhook(expired, "checkout.session.expired"),
    webhook(expired, "checkout.session.expired"),
  ]);
  assert.equal(
    (await conn.query("SELECT stock FROM products WHERE id=?", [product]))[0][0]
      .stock,
    expiryStock + 1,
  );
  const result = await fetch(origin + "/api/admin/order-notifications", {
    method: "POST",
    headers: admin,
    body: "{}",
  });
  assert.equal(result.status, 200);
  assert.equal(
    (
      await fetch(origin + "/api/admin/order-notifications", {
        method: "POST",
        headers,
        body: "{}",
      })
    ).status,
    401,
  );
  const details = await (
    await fetch(origin + "/api/admin/orders?id=" + id, { headers: admin })
  ).json();
  assert.equal(details.notifications.length, 4);
  assert.ok(
    details.notifications.every(
      (n) => n.status && n.recipient && !("body" in n),
    ),
  );
  console.log(
    "PASS order workflow: concurrent checkout/event/email deduplication, processing/dispatch/delivery, optional email, cancellation stock restored once, cancelled retry blocked, signed card payment/session/amount verification, webhook replay/expiry safety and notification access control",
  );
};

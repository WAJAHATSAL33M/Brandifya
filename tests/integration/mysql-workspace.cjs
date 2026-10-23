// Use a NEW EMPTY dedicated MySQL database ending in _test. Never use production.
const { spawn, spawnSync } = require("node:child_process"),
  path = require("node:path");
const project = process.cwd(),
  mysql = require(path.join(project, "node_modules/mysql2/promise"));
(async () => {
  console.log("Checking isolated test database…");
  const uri = process.env.TEST_DATABASE_URL;
  if (!uri || !new URL(uri).pathname.endsWith("_test"))
    throw Error(
      "Set TEST_DATABASE_URL to a new empty dedicated database ending in _test.",
    );
  const { databaseOptions } = await import(
    path.join(project, "lib/database-config.mjs")
  );
  const options = databaseOptions({ ...process.env, DATABASE_URL: uri });
  console.log("Connecting to test database…");
  const connection = await mysql.createConnection({ ...options, bigNumberStrings: false });
  try {
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Test database connected; validating empty schema.");
    if (tables.length)
      throw Error(
        "Integration fixtures require an empty test database. Create a new one.",
      );
  } finally {
    await connection.end();
  }
  const env = { ...process.env, DATABASE_URL: uri, TEST_DATABASE_URL: uri };
  for (const cmd of [
    ["scripts/setup-db.mjs"],
    ["scripts/setup-db.mjs"],
    ["scripts/check-db.mjs"],
    ["--experimental-strip-types", "--test", "tests/database.integration.ts"],
  ]) {
    const r = spawnSync("node", cmd, { cwd: project, env, encoding: "utf8" });
    process.stdout.write(r.stdout);
    process.stderr.write(r.stderr);
    if (r.status !== 0) throw Error("Database check failed");
  }

  const assert = require("assert/strict"),
    crypto = require("crypto");
  const appEnv = {
    ...env,
    STORE_URL: "http://127.0.0.1:3302",
    STORE_LIVE: "true",
    ENABLE_COD: "true",
    SHIPPING_MINOR: "0",
    STORE_COUNTRY: "PK",
    ADMIN_SETUP_TOKEN: "qa-token-".repeat(8),
  };
  const app = spawn(
    "node",
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "-p",
      "3302",
    ],
    { cwd: project, env: appEnv, stdio: ["ignore", "pipe", "pipe"] },
  );
  let appLogs = "";
  app.stderr.on("data", (d) => (appLogs += d));
  let testConnection;
  try {
    await new Promise((resolve, reject) => {
      app.stdout.on("data", (d) => {
        if (String(d).includes("Ready")) resolve();
      });
      app.on("exit", () => reject(Error(appLogs)));
      setTimeout(() => reject(Error("App startup timed out")), 20000).unref();
    });
    const origin = appEnv.STORE_URL;
    const authConn = await mysql.createConnection({ ...options, bigNumberStrings: false });
    const admin = await require(
      project + "/tests/integration/admin-access.cjs",
    )(origin, appEnv.ADMIN_SETUP_TOKEN, authConn);
    await authConn.end();
    async function request(route, init = {}) {
      const r = await fetch(origin + route, init);
      const b = await r.json();
      assert.equal(r.status, 200, route + " " + JSON.stringify(b));
      return { body: b, response: r };
    }
    assert.equal((await request("/api/health")).body.ok, true);
    const p = {
      name: "Hostinger test product",
      priceMinor: 10000,
      originalPriceMinor: 15000,
      stock: 10,
      category: "Tech",
      image: "/products/best0.webp",
      color: "Black",
      description: "Test description",
      active: true,
      badge: "Flash Sale",
      rating: null,
      reviewCount: 0,
      soldCount: 0,
      media: [],
      attributes: { material: "cotton" },
      promotionActive: true,
      promotionStartsAt: "2026-01-01T00:00:00Z",
      promotionEndsAt: "2027-01-01T00:00:00Z",
    };
    const product = (
      await request("/api/admin/products", {
        method: "POST",
        headers: admin,
        body: JSON.stringify(p),
      })
    ).body.id;
    assert.ok(product > 0);
    await request("/api/admin/products", {
      method: "POST",
      headers: admin,
      body: JSON.stringify({ ...p, id: product, name: "Edited product" }),
    });
    const catalog = (await request("/api/catalog")).body;
    assert.equal(catalog.managed, true);
    assert.equal(catalog.live, true);
    assert.equal(
      catalog.products.find((p) => p.id === product).attributes.material,
      "cotton",
    );
    const checkout = {
      requestKey: crypto.randomUUID(),
      method: "cod",
      items: [{ id: product, quantity: 2 }],
      customer: {
        name: "Test Customer",
        phone: "+923187553375",
        address: "Test address",
        city: "Islamabad",
        postalCode: "44000",
        country: "PK",
      },
    };
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        request("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: origin },
          body: JSON.stringify(checkout),
        }),
      ),
    );
    assert.equal(new Set(results.map((r) => r.body.orderId)).size, 1);
    const order = results[0].body.orderId;
    const conn = testConnection = await mysql.createConnection({ ...options, bigNumberStrings: false });
    assert.equal(
      (
        await conn.query("SELECT stock FROM products WHERE id=?", [product])
      )[0][0].stock,
      8,
    );
    assert.equal(
      (
        await conn.query("SELECT total_minor FROM orders WHERE id=?", [order])
      )[0][0].total_minor,
      20000,
    );
    const auth = await import(project + "/lib/auth-core.ts"),
      id = crypto.randomUUID();
    await conn.query(
      "INSERT INTO customers (id,name,email,password_hash,email_verified) VALUES (?,?,?,?,true)",
      [
        id,
        "Test Customer",
        "qa@example.com",
        await auth.hashPassword("test-password-123"),
      ],
    );
    const login = await request("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({
        action: "login",
        email: "qa@example.com",
        password: "test-password-123",
      }),
    });
    const cookie = login.response.headers.get("set-cookie").split(";")[0];
    const userHeaders = {
      "Content-Type": "application/json",
      Origin: origin,
      Cookie: cookie,
    };
    assert.equal(
      (await request("/api/account", { headers: userHeaders })).body.user
        .emailVerified,
      true,
    );
    assert.equal(
      (await fetch(origin + "/api/admin/products", { headers: userHeaders }))
        .status,
      401,
    );
    await request("/api/account", {
      method: "PATCH",
      headers: userHeaders,
      body: JSON.stringify({
        name: "Updated Name",
        email: "qa@example.com",
        phone: "+923187553375",
        address: "Test address",
        city: "Islamabad",
        postalCode: "44000",
        country: "PK",
      }),
    });
    await request("/api/account/orders", {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({ id: order, key: checkout.requestKey }),
    });
    assert.equal(
      (await request("/api/account/orders", { headers: userHeaders })).body
        .total,
      1,
    );
    const dashboard = (await request("/api/admin/orders", { headers: admin }))
      .body;
    assert.equal(dashboard.summary.total, 1);
    assert.equal(dashboard.orders[0].customer.name, "Test Customer");
    const customers = (
      await request("/api/admin/customers", { headers: admin })
    ).body;
    assert.ok(
      customers.customers.some((c) => c.id === id && c.order_count === 1),
    );
    await request("/api/admin/orders", {
      method: "PATCH",
      headers: admin,
      body: JSON.stringify({
        id: order,
        status: "processing",
        trackingNumber: "QA123",
      }),
    });
    const form = new FormData();
    form.set(
      "file",
      new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
        type: "image/png",
      }),
      "qa.png",
    );
    const upload = (
      await request("/api/admin/media", {
        method: "POST",
        headers: { Cookie: admin.Cookie, Origin: origin },
        body: form,
      })
    ).body;
    const image = await fetch(origin + upload.url, {
      headers: { Range: "bytes=0-3" },
    });
    assert.equal(image.status, 206);
    assert.equal((await image.arrayBuffer()).byteLength, 4);
    await request("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ email: "qa@example.com", consent: true }),
    });
    await request("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ email: "qa@example.com", consent: true }),
    });
    assert.equal(
      (await conn.query("SELECT count(*) AS total FROM newsletter"))[0][0]
        .total,
      1,
    );
    await request("/api/admin/products", {
      method: "DELETE",
      headers: admin,
      body: JSON.stringify({ id: product }),
    });
    assert.equal((await request("/api/catalog")).body.products.length, 0);
    for (const cmd of [
      ["--experimental-strip-types", "scripts/seed-demo.ts"],
      ["--experimental-strip-types", "scripts/seed-demo.ts"],
      ["scripts/setup-db.mjs"],
    ]) {
      const r = spawnSync("node", cmd, {
        cwd: project,
        env: { ...env, STORE_LIVE: "false" },
        encoding: "utf8",
      });
      if (r.status !== 0) throw Error(r.stderr);
    }
    assert.equal(
      (await conn.query("SELECT count(*) AS total FROM products"))[0][0].total,
      20,
    );
    assert.equal(
      (
        await conn.query(
          "SELECT count(*) AS total FROM products WHERE active=true",
        )
      )[0][0].total,
      0,
    );
    assert.equal(
      (
        await conn.query("SELECT name FROM products WHERE id=?", [product])
      )[0][0].name,
      "Edited product",
    );
    await require(project + "/tests/integration/admin-workspace.cjs")(
      origin,
      admin,
      conn,
      product,
      order,
    );
    const reset = spawnSync(
      "node",
      ["--experimental-strip-types", "scripts/reset-admin.ts"],
      {
        cwd: project,
        env: {
          ...env,
          ADMIN_USERNAME: "owner",
          ADMIN_PASSWORD: "recovered-password-123",
        },
        encoding: "utf8",
      },
    );
    assert.equal(reset.status, 0, reset.stderr);
    assert.equal(
      (await fetch(origin + "/api/admin/products", { headers: admin })).status,
      401,
    );
    console.log("PASS private CLI password recovery and session revocation");
    await conn.end();
    console.log(
      "PASS idempotent setup and inactive demo import preserve existing products",
    );
    console.log(
      "PASS live API health, admin create/edit/archive, catalog, concurrent COD checkout, stock, login/session/profile, guest order claim/history, order dashboard/status, customer aggregate, binary upload/ranges and newsletter deduplication",
    );
  } finally {
    if(testConnection)await testConnection.end().catch(()=>{});
    app.kill();
    if (appLogs) process.stderr.write(appLogs);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

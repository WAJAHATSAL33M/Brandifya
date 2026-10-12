const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  { spawn } = require("node:child_process"),
  { randomUUID } = require("node:crypto");
const qaRequire = require("node:module").createRequire(
  path.join(
    process.env.MANAGEMENT_TEST_MODULES ||
      path.join(process.cwd(), "node_modules"),
    "package.json",
  ),
);
const { PGlite } = qaRequire("@electric-sql/pglite"),
  { PGLiteSocketServer } = qaRequire("@electric-sql/pglite-socket"),
  { request, chromium } = qaRequire("playwright"),
  pack = qaRequire("@sparticuz/chromium").default;
(async () => {
  const project = process.cwd(),
    db = await PGlite.create();
  await db.exec(
    fs.readFileSync(path.join(project, "database/schema.sql"), "utf8"),
  );
  const socket = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: 55432,
    maxConnections: 10,
  });
  await socket.start();
  const base = "http://127.0.0.1:3290",
    token = "qa-only-admin-token-".repeat(3),
    emailLog = path.join(
      require("node:os").tmpdir(),
      "brande-management-email-fixture.json",
    );
  const server = spawn(
    "node",
    [
      path.join(project, "node_modules/next/dist/bin/next"),
      "start",
      "-p",
      "3290",
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: project,
      env: {
        ...process.env,
        DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:55432/postgres",
        STORE_URL: base,
        STORE_LIVE: "true",
        ENABLE_COD: "true",
        SHIPPING_MINOR: "0",
        ADMIN_API_TOKEN: token,
        RESEND_API_KEY: "qa-only",
        AUTH_FROM_EMAIL: "test@example.test",
        GOOGLE_CLIENT_ID: "qa-google",
        GOOGLE_CLIENT_SECRET: "qa-secret",
        FACEBOOK_CLIENT_ID: "qa-facebook-client",
        FACEBOOK_CLIENT_SECRET: "qa-facebook-secret",
        FACEBOOK_GRAPH_VERSION: "v99.0",
        QA_EMAIL_LOG: emailLog,
        NODE_OPTIONS:
          "--require " + path.resolve("tests/integration/mock-services.cjs"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stderr.on("data", (d) => process.stderr.write(d));
  let browser;
  const contexts = [];
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on("data", (d) => {
        if (String(d).includes("Ready")) resolve();
      });
      server.on("exit", () => reject(Error("server exited")));
      setTimeout(() => reject(Error("server timeout")), 20000).unref();
    });
    const context = async (auth = false) => {
      const c = await request.newContext({
        baseURL: base,
        extraHTTPHeaders: {
          Origin: base,
          ...(auth ? { Authorization: "Bearer " + token } : {}),
        },
      });
      contexts.push(c);
      return c;
    };
    const admin = await context(true),
      a = await context(),
      b = await context(),
      guest = await context();
    async function call(c, url, method, data, status = 200) {
      const r = await c.fetch(url, { method, ...(data ? { data } : {}) });
      let d;
      try {
        d = await r.json();
      } catch {
        d = await r.text();
      }
      assert.equal(r.status(), status, url + " " + JSON.stringify(d));
      return d;
    }
    await call(guest, "/api/admin/products", "GET", null, 401);
    await call(guest, "/api/account/orders", "GET", null, 401);
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
      "base64",
    );
    let r = await admin.post("/api/admin/media", {
      multipart: {
        file: { name: "product.png", mimeType: "image/png", buffer: png },
      },
    });
    assert.equal(r.status(), 200);
    const media = await r.json();
    r = await admin.post("/api/admin/media", {
      multipart: {
        file: {
          name: "bad.png",
          mimeType: "image/png",
          buffer: Buffer.from("<script>bad</script>"),
        },
      },
    });
    assert.equal(r.status(), 400);
    r = await guest.get(media.url);
    assert.equal(r.status(), 200);
    assert.equal(r.headers()["x-content-type-options"], "nosniff");
    const product = {
      id: null,
      name: "Test product",
      priceMinor: 100000,
      originalPriceMinor: 150000,
      stock: 8,
      category: "Tech",
      image: media.url,
      color: "Black",
      description: "Verified QA fixture",
      active: true,
      badge: "New Arrival",
      rating: 4.5,
      reviewCount: 10,
      soldCount: 50,
      promotionActive: false,
      promotionStartsAt: null,
      promotionEndsAt: null,
      media: [{ type: "image", url: media.url, alt: "Second view" }],
      attributes: { SKU: "QA-1", Material: "Cotton" },
    };
    const created = await call(admin, "/api/admin/products", "POST", product);
    const id = created.id;
    await call(admin, "/api/admin/products", "POST", {
      ...product,
      id,
      stock: 7,
    });
    assert.equal(
      (await call(admin, "/api/admin/products", "GET")).products[0].stock,
      7,
    );
    const emailToken = () => {
      const text = JSON.parse(fs.readFileSync(emailLog, "utf8")).text;
      return new URL(text.match(/http[^\s]+/)[0]).searchParams.get("token");
    };
    const password = "Long test password 123";
    await call(a, "/api/account", "POST", {
      action: "signup",
      name: "Customer A",
      email: "a@example.test",
      password,
    });
    await call(
      a,
      "/api/account",
      "POST",
      { action: "login", email: "a@example.test", password },
      401,
    );
    let verify = emailToken();
    await call(a, "/api/account", "POST", { action: "verify", token: verify });
    await call(
      a,
      "/api/account",
      "POST",
      { action: "verify", token: verify },
      400,
    );
    await call(a, "/api/account", "POST", {
      action: "login",
      email: "a@example.test",
      password,
    });
    let profile = (await call(a, "/api/account", "GET")).user;
    assert.equal(profile.email, "a@example.test");
    assert.equal(
      (await a.storageState()).cookies.find((c) => c.name === "brande-session")
        .httpOnly,
      true,
    );
    assert.equal(profile.password_hash, undefined);
    await call(b, "/api/account", "POST", {
      action: "signup",
      name: "Customer B",
      email: "b@example.test",
      password,
    });
    await call(b, "/api/account", "POST", {
      action: "verify",
      token: emailToken(),
    });
    await call(b, "/api/account", "POST", {
      action: "login",
      email: "b@example.test",
      password,
    });
    const customer = {
      name: "Customer A",
      phone: "+92 300 1234567",
      email: "",
      address: "Original Street",
      city: "Lahore",
      postalCode: "54000",
      country: "PK",
    };
    const key = randomUUID(),
      checkout = {
        items: [{ id, quantity: 1 }],
        customer,
        method: "cod",
        requestKey: key,
      };
    const order = await call(a, "/api/checkout", "POST", checkout);
    assert.equal(order.status, "confirmed");
    await call(a, "/api/checkout", "POST", checkout);
    assert.equal(
      (await call(admin, "/api/admin/products", "GET")).products[0].stock,
      6,
    );
    await call(b, "/api/checkout", "POST", checkout, 503);
    await call(guest, "/api/checkout", "POST", {
      ...checkout,
      requestKey: randomUUID(),
      customer: { ...customer, name: "Guest" },
    });
    assert.equal((await call(a, "/api/account/orders", "GET")).total, 1);
    assert.equal((await call(b, "/api/account/orders", "GET")).total, 0);
    await call(
      admin,
      "/api/admin/orders",
      "PATCH",
      { id: order.orderId, status: "delivered" },
      400,
    );
    for (const status of ["processing", "shipped", "delivered"])
      await call(admin, "/api/admin/orders", "PATCH", {
        id: order.orderId,
        status,
      });
    await call(admin, "/api/admin/orders", "PATCH", {
      id: order.orderId,
      trackingNumber: "QA-TRACK",
      trackingUrl: "https://example.com/track",
    });
    let history = await call(a, "/api/account/orders", "GET");
    assert.equal(history.orders[0].status, "delivered");
    assert.equal(history.orders[0].events.length, 3);
    assert.equal(history.orders[0].tracking_number, "QA-TRACK");
    await call(a, "/api/account", "PATCH", {
      ...profile,
      name: "Updated Customer",
      phone: "+92 301 1234567",
      address: "New Street",
      city: "Karachi",
      postalCode: "74000",
      country: "PK",
      currentPassword: password,
    });
    assert.equal(
      (await call(a, "/api/account/orders", "GET")).orders[0].customer.address,
      "Original Street",
    );
    profile = (await call(a, "/api/account", "GET")).user;
    await call(a, "/api/account", "PATCH", {
      ...profile,
      email: "changed@example.test",
      currentPassword: password,
    });
    await call(a, "/api/account", "POST", {
      action: "verify",
      token: emailToken(),
    });
    assert.equal((await call(a, "/api/account", "GET")).user, null);
    await call(a, "/api/account", "POST", {
      action: "login",
      email: "changed@example.test",
      password,
    });
    assert.equal((await call(a, "/api/account/orders", "GET")).total, 1);
    await call(a, "/api/account", "POST", {
      action: "reset",
      email: "changed@example.test",
    });
    await call(a, "/api/account", "POST", {
      action: "verify",
      token: emailToken(),
      password: "New secure password 456",
    });
    await call(
      a,
      "/api/account",
      "POST",
      { action: "login", email: "changed@example.test", password },
      401,
    );
    await call(a, "/api/account", "POST", {
      action: "login",
      email: "changed@example.test",
      password: "New secure password 456",
    });
    r = await guest.post("/api/account", {
      headers: { Origin: "https://evil.example" },
      data: { action: "logout" },
    });
    assert.equal(r.status(), 400);
    for (let i = 0; i < 11; i++)
      r = await guest.post("/api/account", {
        data: { action: "login", email: "throttle@example.test", password },
      });
    assert.equal(r.status(), 400);
    assert.match((await r.json()).error, /Too many/);
    const oauth = await context();
    r = await oauth.get("/api/account/oauth/google", { maxRedirects: 0 });
    assert.equal(r.status(), 307);
    const state = new URL(r.headers().location).searchParams.get("state");
    r = await oauth.get(
      "/api/account/oauth/google?code=qa-code&state=" + state,
      { maxRedirects: 0 },
    );
    assert.equal(r.status(), 307);
    assert.equal(
      (await call(oauth, "/api/account", "GET")).user.email,
      "google@example.test",
    );
    const facebook = await context();
    r = await facebook.get("/api/account/oauth/facebook", { maxRedirects: 0 });
    assert.equal(r.status(), 307);
    const fbState = new URL(r.headers().location).searchParams.get("state");
    r = await facebook.get(
      "/api/account/oauth/facebook?code=qa-code&state=" + fbState,
      { maxRedirects: 0 },
    );
    assert.equal(r.status(), 307);
    assert.equal(
      (await call(facebook, "/api/account", "GET")).user.email,
      "facebook@example.test",
    );
    const wrong = await context();
    await wrong.get("/api/account/oauth/google?code=qa-code&state=wrong", {
      maxRedirects: 0,
    });
    assert.equal((await call(wrong, "/api/account", "GET")).user, null);
    console.log(
      "PASS API: auth boundaries, verified email signup, single-use tokens, login, email change, password reset, throttling, Google callback mock, profile snapshots, guest optional email, ownership isolation, checkout retries, products, uploads, stock and order history.",
    );
    const claimKey = randomUUID();
    const claim = await call(guest, "/api/checkout", "POST", {
      ...checkout,
      requestKey: claimKey,
      customer: { ...customer, name: "Earlier Guest" },
    });
    await call(
      b,
      "/api/account/orders",
      "POST",
      { id: claim.orderId, key: randomUUID() },
      400,
    );
    await call(a, "/api/account/orders", "POST", {
      id: claim.orderId,
      key: claimKey,
    });
    await call(
      b,
      "/api/account/orders",
      "POST",
      { id: claim.orderId, key: claimKey },
      400,
    );
    assert.equal((await call(a, "/api/account/orders", "GET")).total, 2);
    browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.MANAGEMENT_TEST_CHROMIUM || (await pack.executablePath()),
      args: pack.args.filter((a) => a !== "--disable-web-security"),
    });
    const page = await browser.newPage();
    await page.route("https://fonts.googleapis.com/**", (r) =>
      r.fulfill({ contentType: "text/css", body: "" }),
    );
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ["/account", "/admin", "/shop", "/product/" + id]) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          route + " overflow " + width,
        );
        assert.equal(
          await page
            .locator('header a[href="/admin"],footer a[href="/admin"]')
            .count(),
          0,
        );
        if (route === "/account" || route === "/admin")
          await page.screenshot({
            path: path.join(
              require("node:os").tmpdir(),
              "brande-" + route.slice(1) + "-" + width + ".png",
            ),
          });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/admin");
    await page.getByLabel("Admin access token", { exact: true }).fill(token);
    await page.getByRole("button", { name: "Open dashboard" }).click();
    await page.getByRole("heading", { name: "Inventory" }).waitFor();
    await page
      .getByRole("button", { name: "Edit", exact: true })
      .first()
      .click();
    await page.getByRole("heading", { name: "Edit product #" + id }).waitFor();
    await page.screenshot({
      path: path.join(require("node:os").tmpdir(), "brande-admin-editor.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(
        require("node:os").tmpdir(),
        "brande-admin-editor-320.png",
      ),
      fullPage: true,
    });
    await page.goto(base + "/account");
    await page
      .getByLabel("Email", { exact: true })
      .fill("changed@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("New secure password 456");
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .last()
      .click();
    await page
      .getByRole("heading", { name: "Your profile" })
      .waitFor({ timeout: 10000 })
      .catch(async (e) => {
        console.log(
          "ACCOUNT UI ERROR:",
          await page.locator("[role=alert]").allTextContents(),
        );
        await page.screenshot({
          path: path.join(
            require("node:os").tmpdir(),
            "brande-account-error.png",
          ),
        });
        throw e;
      });
    await page
      .getByRole("button", { name: "Toggle navigation", exact: true })
      .click();
    await page
      .getByRole("link", { name: "Your account", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Toggle navigation", exact: true })
      .click();
    await page.screenshot({
      path: path.join(
        require("node:os").tmpdir(),
        "brande-account-profile-320.png",
      ),
      fullPage: true,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.goto(base + "/product/" + id);
    await page
      .getByRole("button", { name: "Add to Cart", exact: true })
      .click();
    await page.getByRole("link", { name: "Go to Cart" }).waitFor();
    await page.goto(base + "/checkout");
    assert.equal(
      await page.locator("input[name=email]").getAttribute("required"),
      null,
    );
    assert.equal(
      await page.locator("input[name=alternatePhone]").getAttribute("required"),
      null,
    );
    assert.ok(
      (await page.locator("input[name=name]").getAttribute("required")) !==
        null,
    );
    assert.ok(
      (await page.locator("input[name=phone]").getAttribute("required")) !==
        null,
    );
    assert.equal(
      await page.locator("input[name=name]").inputValue(),
      "Updated Customer",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log(
      "PASS UI: account login/profile, admin editor, checkout autofill and optional fields, hidden admin navigation, gallery/product cart controls and responsive layouts at 320/390/768/1440px.",
    );
    await call(admin, "/api/admin/products", "DELETE", { id });
    assert.equal((await call(guest, "/api/catalog", "GET")).products.length, 0);
    assert.equal(
      (await call(a, "/api/account/orders", "GET")).orders[0].items.length,
      1,
    );
  } finally {
    if (browser) await browser.close();
    for (const c of contexts) await c.dispose();
    server.kill();
    await socket.stop();
    await db.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

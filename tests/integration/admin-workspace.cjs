// Integration assertions for an isolated test store. Called by the MySQL test harness.
const assert = require("node:assert/strict");
module.exports = async function (origin, admin, conn, product, order) {
  async function req(route, method = "GET", body, expected = 200) {
    const r = await fetch(origin + route, {
      method,
      headers: admin,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const d = await r.json();
    assert.equal(r.status, expected, route + " " + JSON.stringify(d));
    return d;
  }
  for (const route of ["inventory", "purchases", "blogs"])
    assert.equal((await fetch(origin + "/api/admin/" + route)).status, 401);
  await req("/api/admin/inventory", "POST", {
    action: "details",
    id: product,
    sku: "QA-SKU-1",
    supplier: "QA supplier",
    location: "Shelf A",
    costMinor: 5000,
    reorderLevel: 5,
  });
  const stock = Number(
    (await conn.query("SELECT stock FROM products WHERE id=?", [product]))[0][0]
      .stock,
  );
  await req(
    "/api/admin/inventory",
    "POST",
    {
      action: "adjust",
      id: product,
      delta: -100000,
      reason: "Invalid adjustment",
    },
    400,
  );
  await req("/api/admin/inventory", "POST", {
    action: "adjust",
    id: product,
    delta: 3,
    reason: "Count correction",
    reference: "QA",
  });
  await Promise.all(
    [1, 2].map(() =>
      req("/api/admin/inventory", "POST", {
        action: "adjust",
        id: product,
        delta: 2,
        reason: "Concurrent receipt",
      }),
    ),
  );
  assert.equal(
    Number(
      (
        await conn.query("SELECT stock FROM products WHERE id=?", [product])
      )[0][0].stock,
    ),
    stock + 7,
  );
  await req("/api/admin/purchases", "POST", {
    action: "create",
    supplier: "QA supplier",
    notes: "New stock",
    items: [{ productId: product, quantity: 4, costMinor: 5500 }],
  });
  const purchase = (await req("/api/admin/purchases")).purchases[0];
  const received = await Promise.all(
    [1, 2].map(() =>
      fetch(origin + "/api/admin/purchases", {
        method: "POST",
        headers: admin,
        body: JSON.stringify({ action: "receive", id: purchase.id }),
      }),
    ),
  );
  assert.deepEqual(received.map((r) => r.status).sort(), [200, 400]);
  assert.equal(
    Number(
      (
        await conn.query("SELECT stock FROM products WHERE id=?", [product])
      )[0][0].stock,
    ),
    stock + 11,
  );
  await req("/api/admin/orders", "PATCH", {
    id: order,
    note: "Pack carefully",
  });
  assert.equal(
    (await req("/api/admin/orders?id=" + order)).notes[0].note,
    "Pack carefully",
  );
  const beforeCancel = stock + 11;
  const cancels = await Promise.all(
    [1, 2].map(() =>
      fetch(origin + "/api/admin/orders", {
        method: "PATCH",
        headers: admin,
        body: JSON.stringify({ id: order, status: "cancelled" }),
      }),
    ),
  );
  assert.deepEqual(cancels.map((r) => r.status).sort(), [200, 400]);
  assert.equal(
    Number(
      (
        await conn.query("SELECT stock FROM products WHERE id=?", [product])
      )[0][0].stock,
    ),
    beforeCancel + 2,
  );
  assert.equal(
    (await req("/api/admin/orders?status=cancelled&q=Test%20Customer")).total,
    1,
  );
  const post = {
    title: "QA journal story",
    slug: "qa-journal-story",
    excerpt: "A useful story",
    content:
      "<h2>Heading</h2><p>Hello <strong>reader</strong><script>alert(1)</script></p>",
    coverUrl: "/products/best0.webp",
    coverAlt: "Product",
    category: "Home",
    tags: "home, tips",
    author: "Brand E",
    status: "draft",
    publishAt: null,
    seoTitle: "Search title",
    seoDescription: "Search description",
  };
  let saved = await req("/api/admin/blogs", "POST", post);
  assert.equal((await fetch(origin + "/blog/" + post.slug)).status, 404);
  const draft = await req("/api/admin/blogs?id=" + saved.id);
  assert.ok(!draft.post.content.includes("<script>"));
  assert.equal(draft.post.version, 1);
  saved = await req("/api/admin/blogs", "POST", {
    ...post,
    ...saved,
    status: "published",
    version: 1,
  });
  assert.equal(saved.version, 2);
  assert.equal((await fetch(origin + "/blog/" + post.slug)).status, 200);
  assert.ok(
    (await (await fetch(origin + "/api/journal")).json()).posts.some(
      (p) => p.slug === post.slug,
    ),
  );
  await req(
    "/api/admin/blogs",
    "POST",
    { ...post, id: saved.id, version: 1 },
    400,
  );
  assert.equal(
    (await req("/api/admin/blogs?id=" + saved.id)).revisions.length,
    1,
  );
  const renamed = await req("/api/admin/blogs", "POST", {
    ...post,
    id: saved.id,
    version: 2,
    slug: "renamed-qa-story",
    status: "scheduled",
    publishAt: new Date(Date.now() + 3600000).toISOString(),
  });
  assert.equal(renamed.version, 3);
  assert.equal((await fetch(origin + "/blog/renamed-qa-story")).status, 404);
  await conn.query(
    "UPDATE blog_posts SET publish_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE id=?",
    [saved.id],
  );
  assert.equal((await fetch(origin + "/blog/renamed-qa-story")).status, 200);
  await req("/api/admin/blogs", "POST", {
    ...post,
    id: saved.id,
    version: 3,
    slug: "renamed-qa-story",
    status: "trash",
  });
  assert.equal((await fetch(origin + "/blog/renamed-qa-story")).status, 404);
  await req("/api/admin/blogs", "POST", { action: "import" });
  const count = (await req("/api/admin/blogs")).posts.length;
  await req("/api/admin/blogs", "POST", { action: "import" });
  assert.equal((await req("/api/admin/blogs")).posts.length, count);
  assert.ok(
    (await req("/api/admin/inventory")).movements.some(
      (m) => m.reason === "COD order cancelled",
    ),
  );
  console.log(
    "PASS inventory metadata, negative stock rejection, concurrent adjustments, purchase receiving once, notes, COD cancellation once, filtered order search, blog drafts/publish/schedule/trash/revisions/conflict checks and journal import",
  );
};

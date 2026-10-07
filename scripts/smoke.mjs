import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://localhost:3000";
for (const path of ["/", "/checkout", "/order", "/admin"]) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200, path);
  const html = await r.text();
  assert.ok(html.includes("<html"), path);
}
const catalog = await (await fetch(base + "/api/catalog")).json();
assert.equal(catalog.products.length, 8);
assert.equal(catalog.live, false);
const config = await (await fetch(base + "/api/checkout")).json();
assert.equal(config.live, false);
for (const [path, method, status] of [
  ["/api/checkout", "POST", 503],
  ["/api/admin/orders", "GET", 401],
  ["/api/admin/orders", "PATCH", 401],
  ["/api/admin/products", "POST", 401],
  ["/api/newsletter", "POST", 503],
  ["/api/webhooks/stripe", "POST", 503],
  ["/api/order?session_id=invalid", "GET", 400],
]) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(method !== "GET" ? { body: "{}" } : {}),
  });
  assert.equal(r.status, status, path);
}
for (const path of [
  "/home-banner.jpg",
  "/brande-logo.png",
  ...Array.from({ length: 8 }, (_, i) => `/product-${i + 1}.jpg`),
]) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200, path);
  assert.ok(r.headers.get("content-type")?.startsWith("image/"));
}
console.log(
  "HTTP smoke checks passed: all pages, assets, sample catalog, checkout gate, admin authorization, and unavailable-service responses.",
);

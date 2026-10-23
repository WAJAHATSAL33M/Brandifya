const assert = require("node:assert/strict");
module.exports = async function (origin, admin, conn) {
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
  assert.equal((await fetch(origin + "/api/admin/setup")).status, 401);
  assert.equal((await fetch(origin + "/api/admin/taxonomy")).status, 401);
  assert.equal((await req("/api/admin/setup")).ready, true);
  assert.equal((await req("/api/admin/setup", "POST", {})).ready, true);
  for (const [kind, name] of [
    ["category", "Test Collection"],
    ["brand", "Test Brand"],
    ["tag", "Test Label"],
  ])
    await req("/api/admin/taxonomy", "POST", {
      kind,
      name,
      slug: name.toLowerCase().replaceAll(" ", "-"),
      description: "Testing",
      image: "",
      active: true,
    });
  const terms = (await req("/api/admin/taxonomy")).terms,
    c = terms.find((t) => t.kind === "category"),
    b = terms.find((t) => t.kind === "brand"),
    t = terms.find((t) => t.kind === "tag");
  const payload = {
    name: "Managed test product",
    priceMinor: 25000,
    originalPriceMinor: 30000,
    stock: 5,
    category: "Unmanaged",
    image: "/products/best0.webp",
    color: "Black",
    description: "Managed product description",
    active: true,
    badge: "New Arrival",
    rating: null,
    reviewCount: 0,
    soldCount: 0,
    promotionActive: false,
    promotionStartsAt: null,
    promotionEndsAt: null,
    media: [{ url: "/products/best0.webp", type: "image", alt: "Main image" }],
    attributes: { Material: "Leather" },
    organization: {
      categoryId: c.id,
      brandId: b.id,
      tagIds: [t.id],
      status: "active",
      vendor: "Vendor",
      barcode: "ABC-123",
      weightGrams: 500,
      requiresShipping: true,
      seoTitle: "Managed SEO title",
      seoDescription: "Managed search description",
    },
    inventory: {
      sku: "CATALOG-QA",
      supplier: "QA vendor",
      location: "Shelf B",
      costMinor: 10000,
      reorderLevel: 3,
    },
  };
  const id = (await req("/api/admin/products", "POST", payload)).id;
  const saved = (await req("/api/admin/products")).products.find(
    (p) => p.id === id,
  );
  assert.equal(saved.category, c.name);
  assert.equal(saved.brand_name, b.name);
  assert.deepEqual(saved.tag_ids, [t.id]);
  assert.equal(saved.sku, "CATALOG-QA");
  assert.equal(saved.seo_title, "Managed SEO title");
  const publicProduct = (
    await (await fetch(origin + "/api/catalog")).json()
  ).products.find((p) => p.id === id);
  assert.equal(publicProduct.brand, b.name);
  assert.deepEqual(publicProduct.tags, [t.name]);
  const productHtml = await (await fetch(origin + "/product/" + id)).text();
  assert.ok(productHtml.includes("Managed SEO title"));
  await req("/api/admin/taxonomy", "DELETE", { id: b.id }, 400);
  await req("/api/admin/taxonomy", "POST", {
    ...c,
    name: "Renamed Collection",
    slug: "custom-collection-url",
  });
  assert.equal(
    (await req("/api/admin/products")).products.find((p) => p.id === id)
      .category,
    "Renamed Collection",
  );
  assert.equal(
    (await fetch(origin + "/category/custom-collection-url")).status,
    200,
  );
  await req("/api/admin/products/bulk", "POST", {
    ids: [id],
    status: "archived",
  });
  assert.equal((await fetch(origin + "/product/" + id)).status, 404);
  const archived = (await req("/api/admin/products")).products.find(
    (p) => p.id === id,
  );
  assert.equal(archived.product_status, "archived");
  assert.equal(archived.stock, 5);
  await req("/api/admin/products/bulk", "POST", {
    ids: [id],
    status: "active",
  });
  assert.equal((await fetch(origin + "/product/" + id)).status, 200);
  const before = Number(
    (await conn.query("SELECT count(*) AS n FROM products"))[0][0].n,
  );
  await req(
    "/api/admin/products",
    "POST",
    { ...payload, name: "Duplicate SKU attempt" },
    400,
  );
  assert.equal(
    Number((await conn.query("SELECT count(*) AS n FROM products"))[0][0].n),
    before,
  );
  await req(
    "/api/admin/products",
    "POST",
    { ...payload, id, expectedStock: 99 },
    400,
  );
  // Simulate the reported upgrade failure: login still works and owner setup restores missing modules.
  await conn.query("DROP TABLE blog_revisions");
  assert.equal((await req("/api/admin/setup")).ready, false);
  assert.ok((await req("/api/admin/session")).user);
  assert.equal((await req("/api/admin/setup", "POST", {})).ready, true);
  await req("/api/admin/taxonomy", "POST", { action: "importCategories" });
  await req("/api/admin/taxonomy", "POST", { action: "importCategories" });
  console.log(
    "PASS managed categories/brands/tags, atomic product metadata & stock, storefront brand/tag search data, SEO, category rename/custom slug, bulk status, assigned-record protection, SKU rollback, stale stock protection and owner setup recovery",
  );
};

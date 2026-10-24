import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDetails } from "../lib/product-details.ts";
import { adminSchemaStatements } from "../lib/admin-schema.ts";
const organization = {
  categoryId: 1,
  brandId: 2,
  tagIds: [3, 3],
  status: "draft",
  vendor: "Supplier",
  barcode: "ABC",
  weightGrams: 100,
  requiresShipping: true,
  seoTitle: "Title",
  seoDescription: "Description",
};
test("product organization validates managed IDs, status, shipping and inventory", () => {
  assert.deepEqual(validateDetails({ organization }).organization?.tagIds, [3]);
  assert.equal(validateDetails({}).organization, null);
  for (const change of [
    { tagIds: ["3"] },
    { categoryId: -1 },
    { status: "deleted" },
    { weightGrams: 1.5 },
    { requiresShipping: "yes" },
  ])
    assert.throws(() =>
      validateDetails({ organization: { ...organization, ...change } }),
    );
  assert.throws(() =>
    validateDetails({
      inventory: {
        sku: "A",
        supplier: "S",
        location: "Shelf",
        costMinor: -1,
        reorderLevel: 3,
      },
    }),
  );
});
test("authenticated setup uses only the reviewed additive SQL migrations", () => {
  const statements = [
    "admin-workspace.sql",
    "admin-catalog.sql",
    "order-processing.sql",
  ].flatMap((name) =>
    readFileSync(new URL("../database/" + name, import.meta.url), "utf8")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  assert.deepEqual(adminSchemaStatements, statements);
  assert.ok(statements.every((s) => /^CREATE TABLE IF NOT EXISTS/im.test(s)));
  assert.ok(statements.every((s) => !/^\s*(DROP|TRUNCATE|DELETE)/im.test(s)));
});

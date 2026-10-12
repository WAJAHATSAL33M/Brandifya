import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  normalizeEmail,
  newToken,
  tokenHash,
  safeMediaUrl,
} from "../lib/auth-core.ts";
import { validateProduct } from "../lib/product-input.ts";
test("passwords are salted, verified in constant time and enforce length", async () => {
  const a = await hashPassword("A very strong password"),
    b = await hashPassword("A very strong password");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("A very strong password", a), true);
  assert.equal(await verifyPassword("incorrect password", a), false);
  assert.equal(await verifyPassword("password", null), false);
  await assert.rejects(() => hashPassword("short"));
});
test("emails are normalized and session tokens are random hashed credentials", () => {
  assert.equal(normalizeEmail(" Person@Example.com "), "person@example.com");
  assert.throws(() => normalizeEmail("bad"));
  const a = newToken(),
    b = newToken();
  assert.notEqual(a, b);
  assert.equal(tokenHash(a).length, 64);
  assert.notEqual(tokenHash(a), a);
});
test("media URLs reject script, credentials and protocol-relative paths", () => {
  for (const v of [
    "javascript:alert(1)",
    "//evil.example/a",
    "https://name:secret@example.com/a",
    "http://example.com/a",
  ])
    assert.equal(safeMediaUrl(v), false);
  assert.equal(safeMediaUrl("/api/media/example"), true);
  assert.equal(safeMediaUrl("https://example.com/image.webp"), true);
});
const product = {
  name: "Test",
  priceMinor: 10000,
  originalPriceMinor: 15000,
  stock: 3,
  reviewCount: 0,
  soldCount: 0,
  description: "",
  color: "",
  category: "Tech",
  active: false,
  image: "/products/featured0.webp",
  badge: "New Arrival",
  rating: null,
  media: [],
  attributes: { SKU: "TEST" },
  promotionActive: false,
  promotionStartsAt: null,
  promotionEndsAt: null,
};
test("product writes reject invalid price comparisons, media and promotion windows", () => {
  assert.equal(validateProduct(product).name, "Test");
  assert.throws(() =>
    validateProduct({ ...product, originalPriceMinor: 9000 }),
  );
  assert.throws(() => validateProduct({ ...product, stock: -1 }));
  assert.throws(() =>
    validateProduct({
      ...product,
      media: [{ type: "image", url: "javascript:alert(1)", alt: "" }],
    }),
  );
  assert.throws(() =>
    validateProduct({
      ...product,
      promotionActive: true,
      promotionStartsAt: "2030-01-02",
      promotionEndsAt: "2030-01-01",
    }),
  );
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { storefrontDescription } from "../lib/storefront-description.ts";
test("storefront removes the known design-preview suffix without changing merchant detail", () => {
  assert.equal(
    storefrontDescription(
      "A travel bag. Demo product; final materials, measurements, specifications and availability require merchant verification.",
    ),
    "A travel bag.",
  );
  assert.equal(
    storefrontDescription(
      "A leather backpack concept with a vintage silhouette. Dimensions and materials must be verified before sale.",
    ),
    "A leather backpack with a vintage silhouette.",
  );
  assert.equal(
    storefrontDescription("Capacity 1 L. Do not immerse in water."),
    "Capacity 1 L. Do not immerse in water.",
  );
  assert.equal(
    storefrontDescription("A concept-inspired print."),
    "A concept-inspired print.",
  );
});

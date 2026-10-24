import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTrackingContact,
  orderReferencePattern,
} from "../lib/order-tracking.ts";
test("tracking accepts equivalent Pakistani phone formats and case-insensitive email", () => {
  for (const value of [
    "0318-7553375",
    "+92 318 7553375",
    "0092 (318) 7553375",
    "923187553375",
  ])
    assert.equal(normalizeTrackingContact(value), "923187553375");
  assert.equal(
    normalizeTrackingContact(" Customer@Example.COM "),
    "customer@example.com",
  );
  assert.equal(
    normalizeTrackingContact("+1 (825) 927-9370", "CA"),
    "18259279370",
  );
});
test("tracking rejects incomplete references and invalid contact values", () => {
  assert.equal(
    orderReferencePattern.test("bb7a5b78-d5e3-4e4a-9d7b-cddc309df3af"),
    true,
  );
  for (const value of ["bb7a5b78", "../admin", ""])
    assert.equal(orderReferencePattern.test(value), false);
  for (const value of [
    "",
    null,
    "not-a-number",
    "123",
    "invalid@email",
    "<script>1234567</script>",
  ])
    assert.equal(normalizeTrackingContact(value), "");
});

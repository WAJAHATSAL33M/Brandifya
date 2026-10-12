import test from "node:test";
import assert from "node:assert/strict";
import {
  validateItems,
  validateCustomer,
  calculateTotal,
} from "../lib/commerce.ts";
import { sanitizeCart, subtotal } from "../lib/catalog.ts";
test("rejects manipulated quantities, duplicate ids and empty orders", () => {
  for (const value of [
    [],
    [{ id: 1, quantity: -1 }],
    [{ id: 1, quantity: 1.5 }],
    [
      { id: 1, quantity: 1 },
      { id: 1, quantity: 2 },
    ],
    null,
  ])
    assert.throws(() => validateItems(value));
  assert.deepEqual(validateItems([{ id: 1, quantity: 2 }]), [
    { id: 1, quantity: 2 },
  ]);
});
test("server amount uses integer minor units including shipping", () => {
  assert.equal(
    calculateTotal(
      [
        { price_minor: 1290000, quantity: 2 },
        { price_minor: 420000, quantity: 1 },
      ],
      25000,
    ),
    3025000,
  );
  assert.throws(() => calculateTotal([{ price_minor: -1, quantity: 2 }], 0));
  assert.throws(() => calculateTotal([{ price_minor: 100, quantity: 1 }], NaN));
});
test("corrupt saved carts cannot bypass stock or duplicate products", () => {
  assert.deepEqual(
    sanitizeCart([
      { id: 1, quantity: 500 },
      { id: 1, quantity: 2 },
      { id: 999, quantity: 1 },
      { id: 2, quantity: 0 },
    ]),
    [{ id: 1, quantity: 8 }],
  );
  assert.equal(subtotal([{ id: 1, quantity: 2 }]), 25800);
});
test("delivery validation rejects missing details and malformed emails", () => {
  const c = {
    name: "Test User",
    email: "test@example.com",
    phone: "+92 300 1234567",
    address: "123 Test Street",
    city: "Lahore",
    postalCode: "54000",
    country: "PK",
  };
  assert.equal(validateCustomer(c).city, "Lahore");
  assert.throws(() => validateCustomer({ ...c, email: "invalid" }));
  assert.throws(() => validateCustomer({ ...c, name: "" }));
});

test("optional delivery details are retained and checked", () => {
  const base = {
    name: "Test User",
    email: "test@example.com",
    phone: "+92 300 1234567",
    address: "123 Test Street",
    city: "Lahore",
    postalCode: "54000",
    country: "PK",
  };
  const result = validateCustomer({
    ...base,
    region: " Punjab ",
    addressLine2: "Floor 2",
    alternatePhone: "+92 301 1234567",
    landmark: "Near the park",
    notes: "Ring the bell",
    addressType: "Office",
  });
  assert.equal(result.region, "Punjab");
  assert.equal(result.addressLine2, "Floor 2");
  assert.equal(result.addressType, "Office");
  assert.throws(() => validateCustomer({ ...base, alternatePhone: "invalid" }));
  assert.throws(() => validateCustomer({ ...base, addressType: "Invalid" }));
  assert.throws(() => validateCustomer({ ...base, notes: "x".repeat(501) }));
});

test("checkout accepts no email but still requires full name and phone", () => {
  const base = {
    name: "Customer",
    phone: "+92 300 1234567",
    address: "Street 1",
    city: "Lahore",
    postalCode: "54000",
    country: "PK",
  };
  assert.equal(validateCustomer(base).email, "");
  assert.equal(
    validateCustomer({ ...base, email: "", alternatePhone: "" }).email,
    "",
  );
  assert.throws(() => validateCustomer({ ...base, phone: "" }));
  assert.throws(() => validateCustomer({ ...base, name: "" }));
});

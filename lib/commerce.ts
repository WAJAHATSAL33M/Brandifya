export type CheckoutItem = { id: number; quantity: number };
export function validateItems(input: unknown): CheckoutItem[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50)
    throw new Error("Your bag must contain 1–50 products.");
  const seen = new Set<number>();
  return input.map((i) => {
    if (
      !i ||
      !Number.isSafeInteger(i.id) ||
      i.id < 1 ||
      !Number.isSafeInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > 99 ||
      seen.has(i.id)
    )
      throw new Error("Invalid product quantity or duplicate product.");
    seen.add(i.id);
    return { id: i.id, quantity: i.quantity };
  });
}
export function validateCustomer(input: unknown) {
  const c = input as Record<string, unknown>;
  if (!c || typeof c !== "object")
    throw new Error("Delivery details are required.");
  const values: Record<string, string> = {};
  for (const [key, max] of Object.entries({
    name: 120,
    email: 254,
    phone: 30,
    address: 300,
    city: 120,
    postalCode: 20,
    country: 2,
  })) {
    const value = c[key];
    if (typeof value !== "string" || !value.trim() || value.trim().length > max)
      throw new Error(`Please enter a valid ${key}.`);
    values[key] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    throw new Error("Please enter a valid email address.");
  if (!/^[+\d\s()-]{7,30}$/.test(values.phone))
    throw new Error("Please enter a valid phone number.");
  if (!/^[A-Z]{2}$/.test(values.country))
    throw new Error("Invalid delivery country.");
  return values;
}
export function calculateTotal(
  items: { price_minor: number; quantity: number }[],
  shipping: number,
) {
  if (!Number.isSafeInteger(shipping) || shipping < 0)
    throw new Error("Invalid shipping configuration.");
  const total = items.reduce((sum, i) => {
    if (
      !Number.isSafeInteger(i.price_minor) ||
      i.price_minor < 0 ||
      !Number.isSafeInteger(i.quantity) ||
      i.quantity < 1
    )
      throw new Error("Invalid price.");
    return sum + i.price_minor * i.quantity;
  }, shipping);
  if (!Number.isSafeInteger(total) || total <= 0)
    throw new Error("Invalid order total.");
  return total;
}

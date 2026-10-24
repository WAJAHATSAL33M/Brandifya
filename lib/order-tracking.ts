export const orderStatusLabels: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  confirmed: "Order confirmed",
  paid: "Payment received",
  processing: "Preparing your order",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export const orderReferencePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalizeTrackingContact(value: unknown, country = "PK") {
  if (typeof value !== "string" || value.length > 254) return "";
  const clean = value.trim().toLowerCase();
  if (clean.includes("@"))
    return /^\S+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : "";
  if (!/^[+\d\s()-]{7,40}$/.test(clean)) return "";
  let digits = clean.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (country === "PK" && /^03\d{9}$/.test(digits))
    digits = "92" + digits.slice(1);
  return digits.length >= 7 && digits.length <= 15 ? digits : "";
}
export type TrackingOrder = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
  totalMinor: number;
  trackingNumber: string;
  trackingUrl: string;
  items: { name: string; quantity: number }[];
  events: { status: string; createdAt: string }[];
};

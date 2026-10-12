import { safeMediaUrl } from "./auth-core.ts";
export function validateProduct(
  p: Record<string, unknown>,
): Record<string, unknown> {
  const name = typeof p.name === "string" ? p.name.trim() : "";
  if (!name || name.length > 200)
    throw Error("A product title of up to 200 characters is required.");
  for (const key of ["priceMinor", "stock", "reviewCount", "soldCount"]) {
    const v = p[key];
    if (
      !Number.isSafeInteger(v) ||
      Number(v) < (key === "priceMinor" ? 1 : 0) ||
      Number(v) > 100000000
    )
      throw Error("Invalid " + key);
  }
  if (
    p.originalPriceMinor !== null &&
    p.originalPriceMinor !== undefined &&
    (!Number.isSafeInteger(p.originalPriceMinor) ||
      Number(p.originalPriceMinor) <= Number(p.priceMinor))
  )
    throw Error("Regular price must exceed the sale price, or be left blank.");
  if (
    typeof p.description !== "string" ||
    p.description.length > 10000 ||
    typeof p.color !== "string" ||
    p.color.length > 100 ||
    typeof p.category !== "string" ||
    !p.category.trim() ||
    p.category.length > 100 ||
    typeof p.active !== "boolean"
  )
    throw Error("Invalid product details.");
  if (
    typeof p.image !== "string" ||
    !(safeMediaUrl(p.image) || /^photo-[\w-]+$/.test(p.image))
  )
    throw Error(
      "Use a local image path, an HTTPS image URL or an Unsplash photo ID.",
    );
  if (
    typeof p.badge !== "string" ||
    p.badge.length > 24 ||
    /[<>%]/.test(p.badge)
  )
    throw Error("Use a short badge without percentages or markup.");
  if (
    p.rating !== null &&
    (!Number.isFinite(p.rating) || Number(p.rating) < 0 || Number(p.rating) > 5)
  )
    throw Error("Rating must be 0–5, or blank.");
  if (
    !Array.isArray(p.media) ||
    p.media.length > 12 ||
    p.media.some(
      (m) =>
        !m ||
        typeof m !== "object" ||
        !["image", "video"].includes(m.type) ||
        !safeMediaUrl(m.url) ||
        typeof m.alt !== "string" ||
        m.alt.length > 200,
    )
  )
    throw Error("Use up to 12 valid images or videos.");
  if (
    !p.attributes ||
    typeof p.attributes !== "object" ||
    Array.isArray(p.attributes) ||
    JSON.stringify(p.attributes).length > 8000 ||
    Object.entries(p.attributes).some(
      ([k, v]) => k.length > 100 || typeof v !== "string" || v.length > 1000,
    )
  )
    throw Error("Specifications must be a JSON object with text values.");
  if (typeof p.promotionActive !== "boolean")
    throw Error("Invalid promotion setting.");
  if (
    (p.promotionStartsAt &&
      !Number.isFinite(Date.parse(String(p.promotionStartsAt)))) ||
    (p.promotionEndsAt &&
      !Number.isFinite(Date.parse(String(p.promotionEndsAt))))
  )
    throw Error("Invalid promotion date.");
  if (
    p.promotionActive &&
    (!Number.isFinite(Date.parse(String(p.promotionStartsAt))) ||
      !Number.isFinite(Date.parse(String(p.promotionEndsAt))) ||
      Date.parse(String(p.promotionEndsAt)) <=
        Date.parse(String(p.promotionStartsAt)))
  )
    throw Error("An enabled promotion needs a valid start and later end.");
  return { ...p, name };
}

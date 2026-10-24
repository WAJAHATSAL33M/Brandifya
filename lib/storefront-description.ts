// Remove only exact wording used by the former design preview. Merchant product details remain editable.
export function storefrontDescription(value: string) {
  const suffixes = [
    " Demo product; final materials, measurements, specifications and availability require merchant verification.",
    " This is a design sample. Verified specifications and availability have not been supplied.",
    " This product is shown as part of the supplied homepage design. Catalog availability is not configured yet.",
  ];
  let text = value;
  for (const suffix of suffixes) text = text.replaceAll(suffix, "");
  const notices = [
    "Dimensions and materials must be verified before sale.",
    "Capacity, power requirements, and care instructions require merchant verification.",
    "Features, compatibility, and warranty must be confirmed before sale.",
    "Size and material information must be confirmed before sale.",
    "Capacity, voltage, safety certification, and warranty require merchant verification.",
    "Final ingredients, product labels, and suitability information must be supplied before sale.",
    "Size variants, materials, and fit information must be supplied before sale.",
    "Battery life, compatibility, and warranty must be verified before sale.",
  ];
  let legacyConcept = false;
  for (const notice of notices)
    if (text.endsWith(notice)) {
      text = text.slice(0, -notice.length).trim();
      legacyConcept = true;
    }
  return (
    legacyConcept
      ? text.replace(/\bconcept\b/g, "").replace(/ {2,}/g, " ")
      : text
  ).trim();
}

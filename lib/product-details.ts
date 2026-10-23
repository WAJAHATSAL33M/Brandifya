import { integer, text } from "./admin-input.ts";
export function validateDetails(input: Record<string, unknown>) {
  const organization =
    input.organization === undefined
      ? null
      : (input.organization as Record<string, unknown>);
  const inventory =
    input.inventory === undefined
      ? null
      : (input.inventory as Record<string, unknown>);
  if (
    organization &&
    (typeof organization.requiresShipping !== "boolean" ||
      !Array.isArray(organization.tagIds) ||
      organization.tagIds.length > 30 ||
      !["draft", "active", "archived"].includes(String(organization.status)))
  )
    throw Error("Invalid product organization.");
  return {
    organization: organization
      ? {
          categoryId:
            organization.categoryId == null
              ? null
              : integer(organization.categoryId, "category", 1),
          brandId:
            organization.brandId == null
              ? null
              : integer(organization.brandId, "brand", 1),
          tagIds: [
            ...new Set(
              (organization.tagIds as unknown[]).map((v) =>
                integer(v, "tag", 1),
              ),
            ),
          ],
          status: String(organization.status),
          vendor: text(organization.vendor, "vendor", 200),
          barcode: text(organization.barcode, "barcode", 100),
          weightGrams: integer(
            organization.weightGrams,
            "weight",
            0,
            100000000,
          ),
          requiresShipping: organization.requiresShipping === true,
          seoTitle: text(organization.seoTitle, "SEO title", 200),
          seoDescription: text(
            organization.seoDescription,
            "SEO description",
            320,
          ),
        }
      : null,
    inventory: inventory
      ? {
          sku: text(inventory.sku, "SKU", 100) || null,
          supplier: text(inventory.supplier, "supplier", 200),
          location: text(inventory.location, "location", 120),
          costMinor: integer(inventory.costMinor, "unit cost"),
          reorderLevel: integer(
            inventory.reorderLevel,
            "reorder threshold",
            0,
            1000000,
          ),
        }
      : null,
  };
}

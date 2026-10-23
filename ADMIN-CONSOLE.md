# Brand E Admin — catalog and navigation upgrade

## Open the dashboard

Use `/admin`. Blogs now has a dedicated, labelled entry in the desktop sidebar and mobile bottom navigation. Open it directly at `/admin?view=blogs`. Categories, Brands and Tags are separate sections. On phones, use the top-left menu for the full navigation; the bottom bar keeps Home, Products, Inventory, Orders and Blogs visible.

The admin session is checked independently of product/order queries. A missing module table no longer sends a signed-in administrator back to the sign-in form.

## Activate on Hostinger

1. Back up the store database and deploy the latest GitHub `main` branch.
2. Keep the existing private environment variables. `STORE_URL` must match the origin used to open the admin page.
3. Open `/admin`. If the setup banner appears, choose **Finish database setup** while signed in as the owner. This authenticated action runs only the reviewed `CREATE TABLE IF NOT EXISTS` statements for inventory, blogs and catalog organization. It preserves existing rows and cannot run SQL supplied by the browser. It does not perform destructive migrations or rebuild incompatible existing tables.
4. If the database user cannot create tables, import `database/admin-workspace.sql` and `database/admin-catalog.sql` into the existing database through phpMyAdmin, then choose **Check again** under Settings. The full schema has 24 tables. New installations can use `database/schema.sql` or the `build:hostinger` command.
5. Under Categories, choose **Import existing categories** to make legacy category names editable. Under Blogs, choose **Import existing articles** to edit the existing journal stories. Both imports preserve existing managed records.

No new environment secrets are required. If the live site still shows “Merchant access” or a scrolling “Journal” tab, it is running an earlier deployment.

## Product management

The product list includes image previews, SKU, inventory, category/brand, price, status tabs, search, filters, 25-item pagination and CSV export. Select up to 100 products to publish, move to draft or archive. Duplicate a product as a new draft; its SKU and barcode are cleared so they can be reviewed.

The product editor manages:

- Title, description, category and color/finish.
- Main image, up to 12 gallery images/videos, uploads, media-library selection, alternative text and gallery ordering. Allowed upload types remain PNG, JPEG, WebP and MP4, up to 20 MB each subject to hosting/database limits.
- Selling price, compare-at price, unit cost and estimated gross margin before shipping, taxes and payment fees.
- Stock quantity, unique SKU, barcode, supplier, storage location and reorder threshold. Stock edits are logged and stale stock snapshots are rejected. A duplicate SKU rolls back the complete save.
- Draft/active/archived status, managed brand/category/tag assignment, vendor, shipping requirement and weight in grams. Shipping fields are fulfilment metadata; they do not change configured checkout fees.
- Badges, timed promotions, start/end dates, verified ratings/review/sales figures and custom specifications such as material, size, care and warranty.
- SEO title and description, which feed public product-page metadata.

Brands and tags are included in storefront search. Category renaming updates linked product names consistently, and managed category slugs, images and descriptions work on category pages. Storefront header/footer layout, product-card styling and homepage brand artwork are unchanged.

In a non-live store, the empty Products screen offers demo-product import as drafts. It preserves existing IDs and imports no fabricated review/sales statistics. The import is disabled when `STORE_LIVE=true`.

## Categories, brands and tags

Create and edit names, slugs, descriptions, category/brand images and assignment availability. Assigned records cannot be deleted until products are reassigned. Archiving stops new assignments without deleting products or their order history. Renaming a category changes matching products' category labels; old category URLs are not automatically redirected.

## Inventory, orders and blogs

The previous inventory ledger, purchasing, order fulfilment, tracking, internal notes, CSV exports, password controls and rich blog editor are retained. Overview now includes real 14-day order activity. Each module reports its own errors instead of blocking unrelated sections. Settings shows which database groups are ready and the current console version.

This is a custom store-management console inspired by familiar commerce workflows. It is not Shopify or WordPress and does not include their plugin ecosystems. Purchasable variant-level SKUs, multi-warehouse allocation, carrier-label purchasing, accounting and automatic card refunds are not implemented by this upgrade. Specifications remain product attributes rather than separately purchasable variants.

## Verification

- `npm test`: validation, stock/commerce/auth rules, rich-content sanitization and schema synchronization.
- `npm run typecheck` and `npm run build`: TypeScript and production checks.
- `npm run test:workspace`: full backend integration against a new empty `TEST_DATABASE_URL` ending in `_test`; never use production. Includes catalog assignment, atomic saves, duplicate-SKU rollback, bulk visibility, storefront metadata, category links and missing-table setup recovery.

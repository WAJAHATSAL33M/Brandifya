# Brand E admin workspace

Open `/admin` and sign in with your existing admin username and password. The workspace remains private and is not linked in public navigation. Customer accounts do not grant admin access.

## Deploy this upgrade on Hostinger

1. Back up your existing MySQL database.
2. In phpMyAdmin, select the store database and import `database/admin-workspace.sql`. This additive migration creates seven new tables and preserves products, accounts and orders. If admin accounts have not been enabled yet, import `database/admin-access.sql` as well. For a new database use `database/schema.sql`.
3. Deploy the latest `main` branch with Node.js 22, `npm ci`, `npm run build:hostinger` and `npm start`. The build command also creates missing tables. The complete schema now has 24 tables.
4. Keep your existing database variables. `STORE_URL` must match the exact HTTPS origin used to open `/admin`, including `www` when applicable. No additional environment variables are required by this upgrade.
5. Verify inventory, orders and journal publishing before accepting new orders. Stock operations and checkout require the new movement table, so apply the migration before switching to the new deployment.

## Everyday use

- **Overview:** total orders, pending fulfilment, units on hand, restock alerts, inventory cost value, delivered order value by currency and recent stock activity. Order values are operational totals, not bank reconciliation or profit reports.
- **Products:** create/edit/archive products, categories, descriptions, prices, promotions, badges, specifications and image/video galleries. Archiving preserves previous order records. The editor rejects a save if stock changed since it was opened.
- **Inventory:** search products/SKUs/suppliers, filter by stock health, set a unique SKU, supplier, shelf/bin location, unit cost and reorder threshold. Record a positive or negative stock adjustment with a reason and optional reference. Negative stock is rejected. Stock movements include product edits, purchases, checkout and cancellations. Opening balances from before this upgrade are not reconstructed.
- **Purchasing:** create supplier purchase orders with multiple product lines, quantities, unit costs, expected arrival and notes. Receive the complete purchase once to add stock and update the last unit cost, or cancel an unreceived purchase. Receiving is transactional and protected against double clicks. Partial receipts, supplier payments and multiple warehouses are not implemented.
- **Orders:** server-side search by order/customer/phone/tracking, status/date filters, 100-order pagination, delivery details, line items, shipment tracking, internal staff notes, status history and a printable order/packing slip. Advance valid fulfilment stages. Unshipped COD orders can be cancelled with one-time stock restoration. Card refunds and payment reconciliation remain with the payment provider. A status update does not issue a refund.
- **Customers:** search the current page of account records, inspect contact details and order counts. Guest delivery details remain under their orders.
- **CSV exports:** inventory, recent 200 stock movements, recent 200 purchase orders and the current filtered order page. Formula-like text is escaped to prevent spreadsheet formula execution. These are scoped exports, not whole-database backups.

## Journal editor

Choose **Blogs → Import existing articles** once to bring the current store stories into the editor without duplicating them. Existing stories remain visible until explicitly managed. Drafting/trashing an imported story removes that managed version from the public journal. Renaming an imported story suppresses its old built-in URL. Existing links to that old slug will return 404; redirects are not created automatically.

Create or edit an article with:

- Visual rich text or HTML source editing, paragraph/headings, bold, italic, underline, strike, lists, blockquotes, links, alignment, dividers, undo/redo and tables with row/column controls.
- Inline images and MP4 video uploads, plus a paginated media library shared with product uploads. Featured image and alternative text are separate fields. Upload limits remain 20 MB, subject to Hostinger/MySQL limits.
- Title, URL slug, excerpt, author, category, comma-separated tags and SEO title/description.
- Drafts, explicit publishing, scheduled publication, trash/unpublish, sanitized preview and saved revision restore. Revisions load into the editor first; save to apply them. Concurrent edits are rejected rather than silently overwriting another session.
- Draft autosave every 30 seconds once a valid title/slug exists. Published and scheduled posts require an explicit save. Unsaved changes trigger a warning on navigation. Autosave depends on an active authenticated browser session and database connectivity.

Scheduled articles become publicly visible at their saved time on the next request; no cron job is needed. Editor times use the browser's local timezone, while the database uses UTC. Draft, future and trashed posts return 404 to public requests. Server-side HTML sanitization blocks scripts, unsafe URLs, event handlers and unsupported embeds. The public journal archive, single article pages and homepage journal cards read the managed posts.

This is a custom editor with familiar WordPress-style publishing controls. It does not install WordPress or its plugins/themes. Arbitrary script embeds, WordPress plugin compatibility, collaborative real-time editing and third-party SEO plugin integrations are not included.

## Verification

`npm test` checks commerce/auth validation, blog sanitization, publication validation and CSV safety. `npm run build` checks production compilation and types. The isolated MySQL integration assertions in `tests/integration/admin-workspace.cjs` exercise transactional adjustments, duplicate purchase receipts/cancellations, order notes/search and article lifecycle/conflict checks. For a reproducible backend run, first build the app, set `TEST_DATABASE_URL` to a **new empty MySQL database ending in `_test`**, then run `npm run test:workspace`. The harness refuses non-test or non-empty databases, starts a local test app, creates test records and changes only that test database. Discard it afterwards. Never run fixtures against a production database.

## Latest admin navigation and catalog upgrade

See `ADMIN-CONSOLE.md` for the new sidebar/mobile navigation, direct Blogs link, managed Categories/Brands/Tags, product editor, owner-controlled database setup and activation steps. Existing installations also need `database/admin-catalog.sql` or the dashboard setup action.

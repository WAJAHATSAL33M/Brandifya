# Store management and customer accounts

## Activate on the merchant deployment

1. Set DATABASE_URL and a canonical HTTPS STORE_URL. HTTP is accepted only for local loopback development.
2. Run npm run db:setup with that database configured. The schema adds customer sessions, email tokens, media storage, product galleries, specifications, tracking and customer_id on orders. No production database migration is run by the code-editing session.
3. Set a random ADMIN_API_TOKEN of at least 32 characters in deployment settings. Open /admin directly and enter it; the token stays only in page memory. Never put it in a NEXT_PUBLIC variable or public navigation.
4. For verified email registration, recovery and email changes, set RESEND_API_KEY and AUTH_FROM_EMAIL using a verified sender. Without these, registration/recovery buttons are disabled and show their availability.
5. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and authorize the exact callback STORE_URL/api/account/oauth/google. Configure the Google consent screen.
6. Set FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET / FACEBOOK_GRAPH_VERSION (a version supported by the merchant app), and authorize STORE_URL/api/account/oauth/facebook. Configure Facebook Login, email permission and live app availability. Social buttons only become active when provider settings exist. Real provider acceptance still depends on dashboard configuration; automated checks use mocked provider responses.
7. Keep STORE_LIVE=false until final checkout configuration is ready. Database-managed published products are visible before checkout is enabled. With no database configured, the existing demonstration catalog remains available.

## Products and orders

- Add/edit title, category, description, color, active status, stock, price, regular comparison price, rating/counts, badge, scheduled promotions and custom specifications.
- Specifications support SKU, dimensions, material and other descriptive text. They are not independently priced variant SKUs; create separate products for separately tracked variants.
- Upload JPEG/PNG/WebP images and MP4 videos up to 20 MB, or enter HTTPS/local media URLs. Media bytes are persisted in PostgreSQL; database backup and capacity policies must include this table. Videos support byte-range responses.
- Product removal archives it from the storefront and retains order-item history. Restore it by editing its Published setting.
- Orders paginate in batches of 100. Administrators see customer delivery details, order line items, creation time, totals, tracking and processing stages. Paid status remains controlled by payment confirmation; administrators cannot mark an unpaid order as paid.
- Customer account records never expose password hashes or session tokens. Guest customer details appear with their orders.

## Customer privacy and access

- Passwords use salted scrypt hashes. Sessions use random credentials stored as hashes, with HttpOnly/SameSite cookies and Secure on HTTPS.
- Account writes require the canonical origin. Authentication and email actions are rate-limited in the database.
- Email signup requires confirmation; reset and email-change links expire in 30 minutes and are single-use. Reset and email change revoke existing sessions and outstanding account links.
- Provider identities are keyed by provider and subject. Matching email addresses are never silently linked to an existing account; use the existing sign-in method for an already-registered email.
- Customers see only orders created while authenticated under their customer_id. Guest/legacy orders are not automatically claimed by matching an email address. A recent guest order can be explicitly linked using the unguessable request key saved with its confirmation in the same browser; an order already assigned to another account cannot be claimed.
- Profile edits affect future checkout autofill, not historical order delivery snapshots.
- Checkout requires name, phone and delivery address. Email and alternate phone are optional. Stripe receives customer_email only when supplied.

## Validation

npm test includes password, token, media URL, product validation and optional checkout-email checks. A temporary local PostgreSQL-compatible database was used for integration checks of account ownership, verification, reset, profile edits, uploads, checkout retries and order processing; mocked mail/OAuth providers do not certify real provider credentials.

### Repeat the isolated management integration check

Install `@electric-sql/pglite`, `@electric-sql/pglite-socket`, `playwright` and `@sparticuz/chromium` into a separate QA directory. Build the app, then run `node tests/integration/management.cjs` from the repository root with `MANAGEMENT_TEST_MODULES` pointing to that directory's `node_modules`. Optionally set `MANAGEMENT_TEST_CHROMIUM` to a compatible Chromium executable. This test starts an isolated in-memory database, overrides all database/admin/mail/provider settings with test fixtures and mocks external mail/OAuth responses. It does not contact the merchant's database or send real email. Screenshots and the mock mail fixture are written to the OS temporary directory.

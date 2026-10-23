# Brand E — Hostinger Business / Cloud + MySQL setup

Updated 23 October 2026. Repository: https://github.com/WAJAHATSAL33M/Brandifya

This version uses Next.js and Hostinger's MySQL database. No Supabase account or PostgreSQL service is required. The existing store design is preserved. These instructions prepare the code; creating your database, setting private credentials and deploying are actions in your Hostinger account.

## 1. Create the Node.js website

In hPanel choose **Websites → Add website → Node.js Apps** and connect the repository above, branch `main`. Use the **Next.js backend** preset and **Node.js 22**. Use the repository root (the folder containing `package.json`). Your plan must expose Node.js Apps; a static/WordPress-only deployment cannot run accounts, admin or checkout.

Keep the framework's `.next` output defaults. Install with `npm ci`. The normal development build is `npm run build`; for Hostinger use **`npm run build:hostinger`**, which first creates any missing database tables and then builds Next.js. Start with **`npm start`** if the panel asks for a start command. Next.js reads Hostinger's injected `PORT`. Do not export static HTML or point the app at `public_html` as a static website.

## 2. Create the MySQL database

Open **Websites → Dashboard → Databases → Management**. Create a database and a dedicated user with a strong password. Save the complete prefixed database/user names, such as `u123456789_brande` and `u123456789_store`. Give the user access to this database. Use a fresh database for this store, not a database shared with WordPress.

## 3. Add environment variables

Enter private values in the app's hPanel environment settings. Never commit credentials. Start from `.env.example`; replace all example values.

| Variable | Value |
| --- | --- |
| `DB_HOST` | `127.0.0.1` for Hostinger's local database; use the host Hostinger supplies if different |
| `DB_PORT` | `3306` |
| `DB_NAME` | Complete prefixed database name |
| `DB_USER` | Complete prefixed database username |
| `DB_PASSWORD` | Your private database password |
| `DB_SSL` | `false` for the local connection; `true` for a remote database that requires verified TLS |
| `STORE_URL` | Your canonical HTTPS website address, without a trailing slash |
| `STORE_LIVE` | `false` during setup; `true` only after testing real inventory and checkout |
| `NEXT_PUBLIC_STORE_CURRENCY` | `PKR` — set before building |
| `STORE_COUNTRY` | `PK` |
| `SHIPPING_MINOR` | Shipping in paisa: `0` for free, `25000` for Rs 250 |
| `ENABLE_COD` | `false` during setup; `true` to offer cash on delivery |
| `ADMIN_SETUP_TOKEN` | A unique random secret of at least 32 characters |

Generate a one-time setup code locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, store it privately, and enter it in hPanel. Open `/admin`, enter that setup code, and create your owner username and password. Remove the setup variable after successful setup. Future sign-ins use your username and password. For an existing database, import `database/admin-access.sql` first. The customer login does not grant admin access.

Individual `DB_*` values avoid password URL-encoding mistakes. As an alternative, set `DATABASE_URL=mysql://USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/DATABASE`; leave it empty when using `DB_*`. If both are set, `DATABASE_URL` takes precedence. PostgreSQL URLs are intentionally rejected. Optional `DB_SSL_CA` accepts a PEM certificate for remote verified TLS. Certificate verification is never disabled.

Email signup/recovery requires `RESEND_API_KEY` and `AUTH_FROM_EMAIL` from a verified sending domain. Google sign-in requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; callback: `STORE_URL/api/account/oauth/google`. Facebook requires `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, and an explicit supported `FACEBOOK_GRAPH_VERSION`; callback: `STORE_URL/api/account/oauth/facebook`. Leave provider values empty until configured.

Stripe card checkout requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; webhook endpoint: `STORE_URL/api/webhooks/stripe`. Only enable it for an eligible merchant account and supported currency/country. Payment logos alone do not implement EasyPaisa, JazzCash or PayFast checkout. COD can be used independently. No new payment provider has been added in this hosting update.

## 4. Initialise the tables

Choose either method:

**hPanel/phpMyAdmin:** Select your new database, open **Import**, and upload `database/schema.sql` from this repository. It creates all 15 tables. Do not select `database/schema.postgresql.sql`; that file is an archive of the former engine's schema, not a MySQL import.

**Node command:** With the database environment configured, run `npm run db:setup` from the project directory. `npm run build:hostinger` also runs this command. For local execution copy `.env.example` to `.env.local` and enter private test values there. `.env.local` is ignored by Git.

The setup file uses `CREATE TABLE IF NOT EXISTS`: rerunning preserves existing records. It creates missing tables; it does not repair an incompatible pre-existing table or convert another application's schema. DDL is not transactional on MySQL. If setup is interrupted, fix the reported cause and rerun it. Use MySQL 8+ or MariaDB 10.6+ with InnoDB.

Run `npm run db:check` to check connectivity and all 15 tables. If hPanel offers no shell, importing in phpMyAdmin and opening `/api/health` after deployment provides a second route. A successful health response is `{"ok":true,"database":"connected"}`. A 503 response means setup is not complete; it does not expose credentials.

## 5. Deploy and enter inventory

Save the environment, deploy/rebuild and restart the Node.js app. Open `/api/health`, `/shop` and `/admin`. A new database starts with **no published products**. Enter verified titles, prices, stock, images/videos and promotions in `/admin`, then activate the products you want to display. Uploads are stored in MySQL rather than the app's temporary deployment filesystem.

Optional preview inventory: run `npm run db:seed-demo` while `STORE_LIVE=false`. It imports the 20 current example products as **inactive**, preserves existing product IDs, and does not import demo review/sales statistics. Review entries in `/admin` before activation. The command refuses to run with `STORE_LIVE=true`.

Media uploads have a 20 MB application limit. Your hosting request limits and MySQL `max_allowed_packet` must also allow the full upload plus query overhead. If large uploads fail, test a smaller image and confirm the account limit with Hostinger. Database backups include uploaded media; monitor storage use.

## 6. Verify before turning on checkout

- `/api/health` reports connected; `/shop` and category pages show your active database products.
- Add/edit/archive a product; verify price, stock, media, and sale dates update correctly.
- Confirm email delivery, verified login, logout, password reset, profile editing and private order history if accounts are enabled.
- With verified inventory and shipping, enable `STORE_LIVE=true` and `ENABLE_COD=true`, restart, and place a small test COD order. Confirm stock decreases once, the order appears in `/admin`, and repeating the same checkout request does not create a duplicate.
- Check admin order status/tracking, cart quantities, mobile navigation and contact links.
- If Stripe is configured, use Stripe test mode and test signed webhook delivery before switching to production keys.

A database outage returns errors rather than silently presenting demo inventory as live stock. The app uses parameter-bound SQL and transactions for stock changes, one-use OAuth state and request locking. Checkout requires server-side price validation. MySQL tables use InnoDB so rollback and row locks work.

## 7. Backups, updates and migration

Enable Hostinger database backups and export a copy through phpMyAdmin before updates. Never store SQL exports or `.env.local` in a public web folder or Git. Take both source and database backups; media files are in `product_media`.

This update changes the database engine. It **does not automatically copy records from an existing PostgreSQL database**. If you already have customers, orders or inventory there, keep that database intact, keep checkout off, export and map the records into the new MySQL schema in a separate migration, and verify record counts, ownership, stock, totals and media before cutting over. Do not import a PostgreSQL dump directly into phpMyAdmin. The old schema is retained only for that mapping.

For later code updates, pull/deploy `main`, install with `npm ci`, run the setup/build command and restart. Keep environment settings and existing database credentials. Table-structure changes after this first MySQL release require a reviewed migration; rerunning initial setup alone does not add columns to existing tables.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Access denied for a user at `::1` | Use `127.0.0.1`, not `localhost`, for the local Hostinger connection |
| Database unavailable / health 503 | Full prefixed names, password, host, schema import, and app restart |
| App rejects a PostgreSQL URL | Remove the old `DATABASE_URL`; configure MySQL `DB_*` values |
| Empty shop after connecting DB | Add/activate verified products in `/admin`; optional demo import stays inactive |
| Setup command cannot connect during build | Import schema via phpMyAdmin, confirm runtime environment, and temporarily use `npm run build`; restart and check health |
| Invalid request origin / login problems | `STORE_URL` must match the exact browser HTTPS origin, including www if used |
| Signup unavailable | Configure verified transactional email and restart |
| Checkout unavailable | Review `STORE_LIVE`, COD/Stripe configuration, shipping and active stock |
| Uploaded videos fail | App upload size, hosting request limit, MySQL packet limit and database capacity |

## Official reference pages

- Hostinger Node.js setup: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- Hostinger MySQL connection and local host: https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/
- phpMyAdmin import: https://www.hostinger.com/support/1884149-how-to-import-a-database-with-phpmyadmin-in-hostinger/
- MySQL2 driver: https://sidorares.github.io/node-mysql2/docs

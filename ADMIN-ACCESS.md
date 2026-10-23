# Admin access on Hostinger

1. Existing database: import `database/admin-access.sql` in phpMyAdmin. It adds admin tables without deleting store data. New installations can import `database/schema.sql`. The `build:hostinger` command also applies the schema safely.
2. Set the correct HTTPS `STORE_URL` and private database variables in hPanel.
3. Set `ADMIN_SETUP_TOKEN` to a random secret of at least 32 characters. Generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Do not commit its value.
4. Deploy/restart, then open `https://YOUR-DOMAIN/admin`. Enter the setup code, choose a username (3–64 letters, digits, dots, underscores or hyphens), and a password (12–128 characters). This creates the first owner account only.
5. Remove `ADMIN_SETUP_TOKEN` from hPanel and restart. If using the older `ADMIN_API_TOKEN` for initial setup, remove that too. Neither variable grants dashboard/API access after setup.
6. Sign in at `/admin` with your username and password. Use Account security to change your password. Password changes end all admin sessions. Sign out when finished.

The dashboard manages products, inventory, prices, promotions, images/videos, orders, tracking and customer records. It stays out of the public navigation. Admin accounts are separate from customer accounts. Passwords use salted scrypt hashes; sessions expire after eight hours and use HttpOnly, SameSite cookies (Secure on HTTPS). Login attempts are limited. No default username or password is shipped.

If you forget the password, the database owner can run `npm run admin:reset` with private temporary `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables. This resets an existing account only and revokes all its sessions. Remove the temporary variables immediately afterwards. Back up your database before maintenance. Never paste credentials into GitHub or public messages.

## Recovery when admin tables are missing

Redeploy the latest `main` and restart the app. Open `/admin`. If the database is reachable but an admin table is missing, select **Repair admin access** and enter the private `ADMIN_SETUP_TOKEN` configured in Hostinger (at least 32 characters). The code is required before creating any tables. Repair only adds missing admin authentication, rate-limit and lock tables; it does not reset accounts or change products, customers or orders. Then create the first owner, or sign in with the existing owner account.

If automatic repair is denied by database permissions, import `database/admin-access.sql` into the same database configured for the app. This file now includes all four authentication prerequisites.

`STORE_URL` must be the exact public HTTPS origin used to open the site. Connection, credential and database-name errors now show separate instructions. If `DATABASE_URL` is present, it overrides `DB_HOST`, `DB_NAME`, `DB_USER` and `DB_PASSWORD`; remove an outdated URL or update it. Restart after changing environment variables. Never paste private values into GitHub or support screenshots.

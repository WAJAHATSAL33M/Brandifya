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

## Customer signup and social sign-in

Customer email signup intentionally requires email verification. Set `RESEND_API_KEY` and `AUTH_FROM_EMAIL` to a verified sender in Hostinger, alongside the correct MySQL connection and canonical HTTPS `STORE_URL`. Restart the app. Without these, email signup/recovery is unavailable; customer verification is never bypassed. Existing email/password accounts can still sign in.

For Google sign-in, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from the merchant's Google OAuth web application. Register the exact redirect URI `https://YOUR-DOMAIN/api/account/oauth/google`, including the correct www/non-www hostname. For Facebook, configure its matching credentials, `FACEBOOK_GRAPH_VERSION` and `/api/account/oauth/facebook` redirect. Google and Apple remain visible with a clear availability notice when unconfigured; Facebook is hidden when unconfigured. OAuth accounts using an email already registered by another sign-in method must use their existing method; automatic account linking is intentionally not enabled.

Customer dashboard: `/account`. Orders are scoped to the signed-in customer. The dashboard provides aggregate order counts, actual fulfillment milestones, event history and the carrier link when supplied by the store. No arrival estimate is invented. A guest order may be linked only using its saved order ID and private confirmation key. Import the full `database/schema.sql` before testing account and order flows.

## Google and Apple buttons

Both are visible on the email sign-in and signup screens. If a provider lacks its deployment credentials, its button is unavailable and the page explains that customers can use email. A new social customer account is created after successful provider verification; returning customers sign in with the same provider.

**Google:** In Google Cloud, configure an OAuth web client, enable the consent screen and register `https://YOUR-DOMAIN/api/account/oauth/google` as an authorized redirect URI. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Hostinger, set the canonical `STORE_URL`, and restart. If the consent screen is in testing, add the customers who will test it as test users. Publish the consent configuration for public access when eligible.

**Apple:** In Apple Developer → Certificates, Identifiers & Profiles, configure a primary App ID with Sign in with Apple. Create a Services ID for the website, associate it with that App ID, register the website domain and exact return URL `https://YOUR-DOMAIN/api/account/oauth/apple`, and create/download a Sign in with Apple `.p8` key. Web eligibility and account requirements are set by Apple: https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web .

Add these private environment values in Hostinger, never GitHub:

- `APPLE_CLIENT_ID`: the web Services ID (not the Team ID or App ID).
- `APPLE_TEAM_ID`: Apple Developer team identifier.
- `APPLE_KEY_ID`: the identifier of the downloaded Sign in with Apple key.
- `APPLE_PRIVATE_KEY`: complete `.p8` PEM contents, including BEGIN/END lines. Actual newlines and literal `\n` sequences are supported.

Restart the app. Apple requires a real HTTPS hostname; localhost and IP callbacks are unsupported. The server generates short-lived client secrets automatically. Apple callbacks use POST, browser-bound single-use state, a nonce and Apple's signed identity tokens. No extra SQL tables are needed beyond the existing complete schema. For Hide My Email delivery, register the outgoing email source in Apple's Private Email Relay configuration. Existing accounts are not automatically linked solely because emails match.

Reference: https://developer.apple.com/documentation/signinwithapplerestapi/request-an-authorization-to-the-sign-in-with-apple-server. and https://developer.apple.com/documentation/signinwithapple/verifying-a-user .

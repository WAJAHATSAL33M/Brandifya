# Brande / Brandifya — Hostinger deployment from zero to live

Checked: 13 October 2026  
Repository: https://github.com/WAJAHATSAL33M/Brandifya  
Application: Next.js 15, React, Node.js and PostgreSQL  
This is the single deployment runbook. Follow Route A unless you deliberately choose a self-managed VPS. Every domain, password and key below is a placeholder.

## 1. Choose the correct Hostinger route

| Your hosting                                                    | Deployment route                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Hostinger plan with Node.js Web Apps support                    | Route A: Hostinger runs Next.js; an external PostgreSQL service stores data.           |
| Hostinger VPS                                                   | Route B: run Next.js and PostgreSQL on the VPS, or use an external PostgreSQL service. |
| Static-only hosting, Website Builder or WordPress-only workflow | Does not run this application's server APIs. Use a Node.js-capable plan or VPS.        |

Hostinger currently documents Node.js Web Apps for Business Web Hosting and its Cloud plans, with Next.js backend support and Node 22 available. Check your account's actual Web App option before buying or upgrading. PostgreSQL installed on Hostinger itself requires VPS; its standard MySQL database is not a substitute for this code's PostgreSQL database. [H1, H2]

Choose one canonical address, for example **https://store.example.com**. Replace that example everywhere. Use either www or the root domain consistently and redirect the other address to it.

**What stays the same:** the fonts, colors, product cards, original logo and shared footer. Deployment changes where the application runs, not its design.

## 2. What you need before starting

- GitHub access to WAJAHATSAL33M/Brandifya; it may require authorization as a private repository.
- A Hostinger account and the appropriate hosting plan.
- A domain you control and access to its DNS.
- A PostgreSQL database and its private connection URI.
- A password manager for the database password, admin token and provider secrets.
- Resend account and a verified sending domain for email registration/recovery.
- Google OAuth and Facebook Login apps if those login methods should be enabled.
- A merchant-eligible Stripe account only if you intend to use the existing Stripe card integration.
- Verified products, delivery charges, contact information and final policies.

You can launch a **preview** first. Keep STORE_LIVE=false while configuring products and accounts. Do not turn checkout on until the launch checklist is complete.

## 3. Project commands and paths

| Item                          | Exact value for this repository                                    |
| ----------------------------- | ------------------------------------------------------------------ |
| Branch                        | main                                                               |
| Repository root               | Folder containing package.json; no nested project folder in GitHub |
| Node version                  | 22.x                                                               |
| Install command               | npm ci                                                             |
| Build command                 | npm run build                                                      |
| Start command, when requested | npm start                                                          |
| Next.js build folder          | .next                                                              |
| Database initialization       | npm run db:setup                                                   |
| Database schema               | database/schema.sql                                                |
| Unit tests                    | npm test                                                           |
| Merchant dashboard            | /admin                                                             |
| Customer accounts             | /account                                                           |
| Google callback               | /api/account/oauth/google                                          |
| Facebook callback             | /api/account/oauth/facebook                                        |
| Stripe webhook                | /api/webhooks/stripe                                               |

The application needs a running Node server. **Do not use static export, an out folder, or upload only HTML into public_html.** Doing so removes working APIs, sessions, orders and uploads.

Use the detected **Next.js backend** preset on managed Hostinger. Do not invent an entry file called server.js: the repository does not contain one. If a generic preset insists on an entry file, switch to the Next.js preset or ask Hostinger to confirm the supported Next.js startup settings. Keep its framework-specific output defaults unless its current panel explicitly asks for the build folder above.

## 4. Environment variables — the complete list

Enter these in Hostinger's environment-variable settings, not in GitHub source. Hostinger can detect variable names and import a private .env file, but the values must come from your accounts. [H3]

| Variable                   | Value / purpose                                                                         | Needed                                        |
| -------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------- |
| DATABASE_URL               | Private PostgreSQL URI with the provider's TLS settings                                 | Products, admin, accounts, orders, uploads    |
| STORE_URL                  | Canonical HTTPS address, e.g. https://store.example.com                                 | Accounts, checkout, newsletter, OAuth         |
| STORE_LIVE                 | false for setup; true only at launch                                                    | Checkout switch                               |
| NEXT_PUBLIC_STORE_CURRENCY | PKR, or the confirmed store currency                                                    | Prices; set before building                   |
| STORE_COUNTRY              | PK, or the supported two-letter delivery country                                        | Checkout validation                           |
| SHIPPING_MINOR             | Integer delivery charge in minor units; 25000 means PKR 250                             | Live checkout                                 |
| ENABLE_COD                 | true if the merchant actually offers cash on delivery; otherwise false                  | COD                                           |
| ADMIN_API_TOKEN            | Unique random token, at least 32 characters                                             | /admin                                        |
| RESEND_API_KEY             | Private Resend sending key                                                              | Registration, verification, password recovery |
| AUTH_FROM_EMAIL            | Verified sender, e.g. no-reply@store.example.com                                        | Account emails                                |
| GOOGLE_CLIENT_ID           | OAuth web-app client ID                                                                 | Google sign-in                                |
| GOOGLE_CLIENT_SECRET       | Matching private secret                                                                 | Google sign-in                                |
| FACEBOOK_CLIENT_ID         | Facebook application ID                                                                 | Facebook sign-in                              |
| FACEBOOK_CLIENT_SECRET     | Matching private secret                                                                 | Facebook sign-in                              |
| FACEBOOK_GRAPH_VERSION     | Supported version selected for your app, such as the exact vNN.N shown in Meta settings | Facebook sign-in                              |
| STRIPE_SECRET_KEY          | Eligible merchant's test or live secret key                                             | Card checkout                                 |
| STRIPE_WEBHOOK_SECRET      | Signing secret for the matching webhook endpoint and mode                               | Reliable card payment confirmation            |

Leave optional provider keys unset until ready. Do not put placeholder strings into secret fields: nonempty fake keys can make a provider appear available while failing at runtime. Do not put any database, admin, mail or provider secret in a NEXT_PUBLIC_ variable.

Generate your admin token locally with Node:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Store the result privately. It is the password-equivalent token for /admin. Never send it in a URL or commit it.

Starter configuration **with placeholders only**:

```dotenv
DATABASE_URL=postgresql://YOUR_PRIVATE_DATABASE_URI
STORE_URL=https://store.example.com
STORE_LIVE=false
NEXT_PUBLIC_STORE_CURRENCY=PKR
STORE_COUNTRY=PK
SHIPPING_MINOR=0
ENABLE_COD=false
ADMIN_API_TOKEN=YOUR_RANDOM_PRIVATE_TOKEN
RESEND_API_KEY=
AUTH_FROM_EMAIL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
FACEBOOK_GRAPH_VERSION=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Never deploy that placeholder database URI or token. Replace them privately with real values.

NEXT_PUBLIC_ values are embedded during a Next.js build; rebuild after changing currency or public support email. Redeploy after other settings changes too, then verify the running app picked them up. [N1, H5]

## 5. Route A — prepare an external PostgreSQL database

A concrete option is **Supabase PostgreSQL**; another PostgreSQL provider is also acceptable. The app uses a direct PostgreSQL driver, not Supabase Auth or its browser API.

1. Create a separate project for this store and choose a region near the application.
2. Choose a database password and record it securely.
3. In Supabase, open Connect and select **Session pooler** for the persistent Node app when an IPv4-compatible connection is needed.
4. Copy its complete connection URI; do not guess the host or username. Replace the password placeholder and percent-encode reserved characters.
5. Use the provider's required TLS settings, normally sslmode=require for a remote URI.
6. Put the completed URI into Hostinger as DATABASE_URL.
7. Do not use the transaction pooler on port 6543 with the code's current default prepared-statement behavior. Session mode on the copied port 5432 supports that behavior. [D1]

If you use Hostinger's database wizard, confirm that **DATABASE_URL** is populated with the correct PostgreSQL URI. Merely adding a Supabase project URL or browser API key does not configure this app.

### Create the tables before deploying with DATABASE_URL

**Option 1 — SQL editor:** open the repository's database/schema.sql, copy its entire content into your database provider's SQL editor and run it against the new store database. This includes all product, customer, session, order, promotion and media additions.

**Option 2 — local terminal:** install Node 22 and Git on your computer. Clone the repository and create a private .env.local:

```bash
git clone https://github.com/WAJAHATSAL33M/Brandifya.git
cd Brandifya
npm ci
```

Create .env.local in this folder containing only your real DATABASE_URL, then:

```bash
npm run db:setup
```

Use GitHub authentication for a private repository; never paste a GitHub token into the clone URL. Do not commit .env.local.

Managed Hostinger does not guarantee an interactive npm/Node shell on Business/Cloud hosting, so run initialization through the provider SQL editor or your local computer, not through an assumed Hostinger SSH npm command. [H1]

The schema creates tables but **does not seed products**. An empty shop immediately after attaching a new database is expected.

### Supabase-specific protection

This application does not need public Data API access to its store tables. In a dedicated Supabase project, run the following after schema setup to deny anonymous/browser API roles access. The server's private owner connection still accesses the tables. If you use a custom runtime database role, verify its privileges/RLS behavior separately.

```sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','orders','order_items','newsletter',
    'customers','customer_sessions','customer_identities',
    'account_tokens','oauth_states','auth_limits',
    'order_events','product_media'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
REVOKE ALL ON SEQUENCE public.order_events_id_seq FROM anon, authenticated;
```

Do not add permissive public policies to customer/session/order tables. Repeat the protection for new store tables in later migrations. Supabase documents grants and RLS as separate access controls. [D2]

## 6. Route A — deploy the repository in Hostinger

1. Open Hostinger's Websites area and create a Web App.
2. Choose Import Git Repository, authorize the correct GitHub account and select **WAJAHATSAL33M/Brandifya**, branch **main**.
3. Use repository root as the project directory.
4. Select Next.js backend and Node 22.x.
5. Confirm installation/build/start settings against section 3; use npm scripts rather than a static build.
6. Add the completed environment variables from section 4. Keep STORE_LIVE=false and ENABLE_COD=false during setup.
7. Deploy and read the build log. A successful build should identify the dynamic API routes as well as normal pages.
8. Open the app and verify /shop, /account and /admin respond.

Hostinger supports GitHub deployment with automatic builds for connected repositories. Verify the selected branch and deployment status in your own dashboard. [H1]

**ZIP alternative:** upload the project source ZIP through the Node.js Web App workflow, with package.json at the ZIP root. Include app, lib, public, database, scripts, package-lock.json and configuration files. Exclude node_modules, .next, .git, private .env files, test artifacts and database dumps. ZIP updates require uploading an updated source archive. [H5]

### Connect the domain and HTTPS

Use Connect domain in the application's dashboard or website list, enter your domain and follow the exact DNS instructions provided for that app. Do not copy a random server IP from another tutorial. Preserve existing mail-related DNS records. Hostinger documents automatic SSL after the domain connection completes. [H4]

After the domain works:

- Set STORE_URL to the exact canonical HTTPS origin, with no path and preferably no trailing slash.
- Redirect the alternate www/non-www address to that origin.
- Rebuild/redeploy and use the canonical address for every test.
- Update OAuth callback and Stripe webhook URLs to the same domain.

You may use a temporary HTTPS address for initial testing, but STORE_URL must match the address being tested. Update all provider URLs when switching to the final domain.

If the domain already hosts another website, back it up first. Prefer staging the new app separately; do not remove the old production website merely to experiment with deployment.

## 7. Add actual inventory through /admin

Open **https://store.example.com/admin** directly. It is intentionally absent from the public header/footer.

1. Enter ADMIN_API_TOKEN.
2. Select Add product.
3. Enter title, category, description and color/finish.
4. Enter the current selling price in normal currency units. Enter a higher original price only for a genuine discount.
5. Enter stock and select Published when the product should appear in the shop.
6. Upload the main image, add optional gallery images/MP4 video and image descriptions.
7. Add specifications such as SKU, dimensions and care instructions.
8. Set badges, review/sales counts and optional promotion start/end dates using verified information.
9. Save and check the product in /shop and its product page.

The editor converts prices to database minor units. Other operational details:

- Pictures: JPEG, PNG or WebP. Videos: MP4. Application upload limit: 20 MB per file; the hosting proxy may impose a smaller limit.
- Upload bytes are stored in PostgreSQL, so backups must include product_media.
- An image/video added by URL remains dependent on that external host.
- Removing a product archives it from the storefront and preserves past order line items.
- Specifications are descriptive attributes, not separately priced variant stock. Create separate products for separately tracked variants.
- Connecting a database switches the storefront to published database inventory even with STORE_LIVE=false. Blank inventory does not fall back to demo products.
- Keep misleading sample ratings, stock claims and promotional prices out of live inventory.

## 8. Activate email registration and recovery

The current code sends account messages through **Resend**, not generic SMTP.

1. Add your sending domain or subdomain in Resend.
2. Add the exact DNS verification records Resend provides and wait for verification. Preserve your existing MX records unless you intentionally change mailbox hosting.
3. Create a sending API key appropriate for that domain.
4. Add RESEND_API_KEY and AUTH_FROM_EMAIL to Hostinger; use a sender address on the verified domain.
5. Redeploy.
6. Visit /account and create a test customer with an inbox you control.
7. Confirm the received link, then sign in.
8. Test password reset, logout and changing the email address.

Verification/recovery links expire in 30 minutes. Email changes revoke existing sessions after confirmation. A provider's limited test sender is not a substitute for a verified production domain. [E1, E2]

Public email, telephone and address are maintained in `lib/store-contact.ts`; update that file and rebuild when these details change. This is independent of the sending API key. Newsletter signup currently records consented email addresses in the database; it is not a newsletter campaign-sending service.

## 9. Activate Google and Facebook login

### Google

In the merchant's Google Cloud project:

1. Configure OAuth branding/consent information and the authorized domain.
2. Create an OAuth client of type Web application.
3. Set this exact authorized redirect URI:

```text
https://store.example.com/api/account/oauth/google
```

4. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Hostinger.
5. If the application is still in testing, add the test users needed for your checks. Complete the provider's production publishing requirements before public launch.
6. Redeploy and test Continue with Google. [G1]

### Facebook

In the merchant's Meta developer app:

1. Configure Facebook Login for the store website and its current supported login product.
2. Set the site URL/app domain and valid OAuth redirect URI:

```text
https://store.example.com/api/account/oauth/facebook
```

3. Provide the actual public privacy-policy URL /privacy-policy. Configure any data-deletion contact/process Meta requires for the app; the store does not currently expose a Meta-specific deletion callback.
4. Set FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET and FACEBOOK_GRAPH_VERSION to the values/version supported by that app.
5. Configure email permission and any required review/live access. Test with app roles while in development mode, then test a normal customer after the app is eligible for public use.
6. Redeploy and test Continue with Facebook. [F1]

The current Facebook flow requires the provider to supply an email address. Accounts with the same email are not silently merged across login methods. Use the original method for an already-registered address. A visible provider button only proves configuration values exist; complete a real login to prove provider setup works.

Do not use callback addresses ending in /callback unless the application routes are changed; our exact routes are the two URLs above.

## 10. Configure checkout and payments

### Cash on delivery

After delivery rules are approved:

```dotenv
ENABLE_COD=true
SHIPPING_MINOR=25000
```

That shipping example means **PKR 250**, not PKR 25,000. Use the merchant's real charge. Keep STORE_LIVE=false until final activation.

The checkout requires full name, primary phone and delivery address fields. Email and alternate phone are optional.

### Stripe card checkout — only for an eligible merchant account

1. Confirm the merchant can legitimately use Stripe for its business jurisdiction and currency. Do not assume a Pakistan-based merchant can activate Stripe directly; confirm eligibility with Stripe.
2. Start with Stripe test credentials on a **separate staging database/domain**, not the live order database.
3. Set STRIPE_SECRET_KEY using the test secret.
4. Create a webhook endpoint:

```text
https://store.example.com/api/webhooks/stripe
```

For staging, replace that origin with the staging origin. 5. Subscribe to:

- checkout.session.completed
- checkout.session.async_payment_succeeded
- checkout.session.expired
- checkout.session.async_payment_failed

6. Copy that endpoint's signing secret to STRIPE_WEBHOOK_SECRET.
7. Redeploy and complete a test order using Stripe's documented test methods.
8. Confirm the database order becomes paid after a valid webhook; visiting a success page alone is not proof of payment.
9. For production, use the matching live secret and live webhook signing secret, then redeploy. [P1, P2]

**EasyPaisa, JazzCash, PayFast, bank transfer and refunds:** footer logos are visual branding only. The current live checkout implements COD and Stripe, not those wallet/gateway integrations. They require separate merchant contracts and code integrations before they can collect payments. There is also no automatic refund-processing dashboard yet.

## 11. Activate the store and test the real domain

Complete product/policy/provider setup, then set:

```dotenv
STORE_LIVE=true
```

Enable at least one genuinely available payment method and redeploy.

Checklist:

- [ ] Domain uses HTTPS and matches STORE_URL exactly.
- [ ] Home, shop, category, product, journal and support pages work.
- [ ] /admin accepts only the correct private token and has no public navigation link.
- [ ] Published products, stock, regular/sale prices and media persist after redeployment.
- [ ] Add-to-cart and Buy Now use the selling price; Buy Now opens the cart.
- [ ] Guest checkout works with blank email/alternate phone, but rejects blank name/primary phone.
- [ ] Signed-in checkout links an order to that account.
- [ ] A second customer cannot see the first customer's orders.
- [ ] Profile changes affect future checkout details, not historical delivery snapshots.
- [ ] Guest-order linking requires the saved confirmation proof and cannot overwrite another account's ownership.
- [ ] Email confirmation/recovery works in real inboxes.
- [ ] Google/Facebook work for ordinary customers, not only developer test accounts.
- [ ] Admin processing → shipped → delivered updates are visible in the customer's history.
- [ ] Tracking URL and number are correct; the system does not automatically book couriers.
- [ ] Newsletter consented addresses are stored.
- [ ] If cards are enabled, test the webhook and an approved live transaction/refund workflow.
- [ ] Review mobile, tablet and desktop, including header, checkout and account forms.
- [ ] Replace preview-only notes, sample merchant address/phone, social placeholders and draft policy terms through reviewed content updates before advertising a fully live store.

The last item requires confirmed merchant content. STORE_LIVE is not a blanket switch that finalizes every draft page, social link or contact detail.

## 12. Updates, backups and rollback

### Managed Hostinger updates

Push reviewed code to the connected GitHub branch and check Deployments. For environment-only changes, use Environment Variables, then Redeploy. A source deployment does not automatically apply database migrations. Apply reviewed additive SQL changes before deploying code that needs them. [H5]

Do not edit live application files through FTP/File Manager and expect changes to survive a new deployment. Keep changes in the repository.

### Backups

- Enable the database provider's backups/retention appropriate for your plan.
- Keep an independent encrypted PostgreSQL export and test restoring it to a separate database.
- Include orders, order_items, customers, sessions, product_media, inventory and all other store tables.
- Keep private configuration in a password manager or protected server backup, not GitHub.
- GitHub stores the application source and built-in public assets; it does not back up live uploads or customer/order data.

### Rollback

Record the last known good commit and deployment. Roll back code through Hostinger's supported deployment controls or a reviewed Git revert/redeployment. Do not restore an old order database to fix a CSS/code issue: that can discard newer orders. Database restoration needs a separate, reviewed recovery plan.

### Day-to-day

Refresh /admin to check new orders, process them through valid stages, enter real courier tracking, monitor low stock, review resource usage and upload/storage growth, and periodically test account emails and payment webhook delivery.

## 13. Troubleshooting

| Symptom                                        | Check / fix                                                                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Only static pages work; APIs fail              | Deploy as Next.js backend, not static output.                                                                              |
| Build asks for a nonexistent server.js         | Use the framework preset and repository npm scripts; confirm the current Hostinger start fields.                           |
| Build cannot resolve packages                  | Use repository root, package-lock.json and npm ci; install dev dependencies for the build.                                 |
| Runtime fails after Node change                | Select Node 22.x and rebuild.                                                                                              |
| Admin says Unauthorized                        | ADMIN_API_TOKEN must match and have at least 32 characters; no public-prefixed token variable.                             |
| Admin/database/account errors                  | Check DATABASE_URL, connection reachability, TLS and that the full schema ran.                                             |
| Empty shop after database connection           | Add and publish actual products; schema setup deliberately does not seed them.                                             |
| Invalid request origin or checkout origin      | Use the same HTTPS host as STORE_URL; correct www redirects and temporary-domain settings.                                 |
| Prepared statement/pooler errors               | Use a compatible session/direct PostgreSQL connection; do not choose Supabase transaction mode without code changes.       |
| Email buttons unavailable                      | Configure Resend key, verified sender, database and canonical URL, then redeploy.                                          |
| Verification link expired                      | Request a new confirmation/reset link; links expire and are single-use.                                                    |
| Google redirect_uri_mismatch                   | Provider redirect URI must exactly match /api/account/oauth/google on the canonical origin.                                |
| Facebook sign-in fails                         | Check app access mode, email permission, supported Graph version and exact redirect URI.                                   |
| Old orders do not appear                       | Only account-owned orders are shown. Use explicit proof-based guest linking where available.                               |
| Media upload fails                             | Check file type/size, product_media schema, database space and Hostinger request-body limits; retry a smaller image/video. |
| Order stays awaiting_payment                   | Check webhook mode, secret, event delivery/signature, payment amount/currency and database connectivity.                   |
| Checkout remains unavailable                   | STORE_LIVE=true, working database and at least one configured payment method are required.                                 |
| Prices/currency or public email did not change | Rebuild; NEXT_PUBLIC_ values are set at build time.                                                                        |
| 502/503 on VPS                                 | Check service logs, database, port 3000 listener and Nginx upstream.                                                       |

## 14. Route B — complete VPS alternative

Use this route **instead of managed Node.js deployment** when you want to administer the server yourself. The commands assume a new Ubuntu 24.04 VPS, sudo/root access, an unused domain and no existing application/database. Review commands before using them on an existing production server.

### B1. DNS, packages and Node

In DNS, point the store domain's A record to the VPS IPv4 address. Preserve existing email records. Log in using Hostinger's supplied SSH details.

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git nginx postgresql postgresql-contrib certbot python3-certbot-nginx ufw
curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup_22.sh
less /tmp/nodesource_setup_22.sh
sudo -E bash /tmp/nodesource_setup_22.sh
sudo apt install -y nodejs
node --version
npm --version
```

Use the official NodeSource instructions if their installer changes. [V1] Confirm Node 22.x before continuing.

Allow the actual SSH port before enabling a firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

If SSH uses a nonstandard port, allow that port first instead. Do not expose PostgreSQL port 5432 or Node port 3000 publicly.

### B2. Service user and private repository

```bash
sudo adduser --system --group --home /srv/brande --shell /bin/bash brande
sudo install -d -m 700 -o brande -g brande /srv/brande/.ssh
sudo -u brande ssh-keygen -t ed25519 -C hostinger-brandifya -f /srv/brande/.ssh/id_ed25519
sudo -u brande cat /srv/brande/.ssh/id_ed25519.pub
```

Add the displayed **public** key as a read-only GitHub deploy key on the repository. Keep the private key on the server; never paste it into GitHub or chat. Verify GitHub's host-key fingerprint when SSH first connects.

```bash
sudo -u brande git clone git@github.com:WAJAHATSAL33M/Brandifya.git /srv/brande/app
```

### B3. Local PostgreSQL

```bash
sudo -u postgres createuser --pwprompt brande_app
sudo -u postgres createdb --owner=brande_app brande_store
```

Use a long database password; a randomly generated hex password avoids URI punctuation problems. Leave PostgreSQL listening locally, not on a public interface.

Create /srv/brande/app/.env.local using a secure editor with the variables from section 4. For this local database, the URI is:

```dotenv
DATABASE_URL=postgresql://brande_app:YOUR_PRIVATE_PASSWORD@127.0.0.1:5432/brande_store
STORE_URL=https://store.example.com
STORE_LIVE=false
```

The local loopback database example does not require remote TLS. The **store website** still requires HTTPS.

```bash
sudo chown brande:brande /srv/brande/app/.env.local
sudo chmod 600 /srv/brande/app/.env.local
sudo -u brande bash -c 'cd /srv/brande/app && npm ci && npm run db:setup && npm test && npm run build'
```

Provide every required variable, not only the three illustrated here. Do not commit .env.local.

### B4. Persistent application service

Create /etc/systemd/system/brande.service:

```ini
[Unit]
Description=Brande Next.js store
After=network.target postgresql.service

[Service]
Type=simple
User=brande
Group=brande
WorkingDirectory=/srv/brande/app
Environment=NODE_ENV=production
EnvironmentFile=/srv/brande/app/.env.local
ExecStart=/usr/bin/node /srv/brande/app/node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now brande
sudo systemctl status brande
curl -I http://127.0.0.1:3000
```

### B5. Nginx and HTTPS

Create /etc/nginx/sites-available/brande, replacing the example domain:

```nginx
server {
    listen 80;
    server_name store.example.com;
    client_max_body_size 21m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

21 MB allows multipart overhead around the application's 20 MB file limit.

```bash
sudo ln -s /etc/nginx/sites-available/brande /etc/nginx/sites-enabled/brande
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d store.example.com
sudo certbot renew --dry-run
```

Choose HTTPS redirection when offered. Use Certbot's current official instructions if OS packaging differs. [V2] Recheck STORE_URL and finish sections 7–11.

### B6. Backups, logs and updates

```bash
sudo journalctl -u brande -n 100 --no-pager
sudo nginx -t
sudo install -d -m 700 -o postgres -g postgres /var/backups/brande
sudo -u postgres pg_dump -Fc -f /var/backups/brande/brande_store.dump brande_store
```

That command writes a manual backup and overwrites the same filename next time. Arrange scheduled, timestamped backups and copy them encrypted off-server; keep more than one restore point. Test recovery into a separate database.

For a reviewed code update:

```bash
sudo -u brande git -C /srv/brande/app pull --ff-only
sudo -u brande bash -c 'cd /srv/brande/app && npm ci && npm test && npm run db:setup && npm run build'
sudo systemctl restart brande
sudo systemctl status brande
```

Back up first and review schema changes before running them. For a simple small-server update, schedule maintenance if rebuilding the currently running .next folder; use versioned release directories/atomic switches for a zero-downtime deployment workflow. Do not restore old order data as a code rollback.

## 15. Final handover record

Fill this privately; do not put actual secrets in this guide or GitHub.

| Item                                           | Record |
| ---------------------------------------------- | ------ |
| Canonical HTTPS domain                         |        |
| Hostinger app / VPS name                       |        |
| Repository branch and deployed commit          |        |
| Database project and region                    |        |
| Database backup schedule and last restore test |        |
| Admin-token password-manager entry             |        |
| Resend sender domain and support inbox         |        |
| Google/Facebook app names and callback URLs    |        |
| Enabled payment methods and Stripe mode        |        |
| Approved shipping charge/country               |        |
| Launch date and responsible operator           |        |

## 16. Official references

These links support the hosting/provider instructions; application behavior was checked against this repository's source. Panel names and provider requirements can change.

- H1: Hostinger Node.js Web Apps, plans and deployment — https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- H2: Hostinger database support — https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/
- H3: Hostinger environment variables — https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/
- H4: Hostinger domain and SSL — https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/
- H5: Hostinger redeployment — https://www.hostinger.com/support/how-to-redeploy-a-node-js-application/
- N1: Next.js environment variables — https://nextjs.org/docs/app/guides/environment-variables
- D1: Supabase PostgreSQL connections and prepared statements — https://supabase.com/docs/guides/database/connecting-to-postgres
- D2: Supabase database API security — https://supabase.com/docs/guides/api/securing-your-api
- E1: Resend verified domains — https://resend.com/docs/dashboard/domains/introduction
- E2: Resend API keys — https://resend.com/docs/dashboard/api-keys/introduction
- G1: Google OAuth setup — https://developers.google.com/identity/openid-connect/openid-connect
- F1: Meta Facebook Login — https://developers.facebook.com/docs/facebook-login/
- P1: Stripe webhooks — https://docs.stripe.com/webhooks
- P2: Stripe supported business countries — https://stripe.com/global
- V1: NodeSource Debian/Ubuntu setup — https://github.com/nodesource/distributions
- V2: Certbot — https://certbot.eff.org/instructions


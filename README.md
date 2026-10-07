# Brandifya / Brande

A Next.js App Router general-store foundation styled from the supplied **Brande HOMEPAGE Final** design: orange (#ff5100), black, white, the supplied logo, promotional hero, category artwork, and product artwork. Product names match the sample imagery. Source promotional prices, ratings, sales counts, and service promises have not been presented as verified store claims.

## Run

Requires Node.js 22+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Production: `npm run build && npm start`. Deploy as a Node.js Next.js app on a provider supporting HTTPS and server routes. This repository does not include a deployed hosting account or public preview URL.

## Included

- Responsive homepage, six category tiles, product catalog, search, sorting, product details, saved favorites, and cart persistence.
- Keyboard-accessible dialogs, focus trapping, Escape dismissal, reduced-motion support, and small-screen layout rules.
- Delivery form, cash on delivery, Stripe hosted checkout integration, webhook signature verification, order status page.
- Server-side validation and database prices, atomic stock reservations, integer minor-unit totals, duplicate-request protection, and stock release on failed/expired Stripe sessions.
- PostgreSQL schema, live catalog endpoint, product-management API, order-management API and `/admin` order interface.
- Newsletter subscription persistence with explicit consent. Email campaigns/delivery are not connected.
- Demo mode prevents orders and charges until explicitly configured.

## Launch configuration (required)

1. Provision PostgreSQL. Set `DATABASE_URL`, then run `npm run db:setup`. This creates tables; it does **not** turn sample items into sellable inventory.
2. Set `STORE_URL` to the exact HTTPS deployment origin. Set `NEXT_PUBLIC_STORE_CURRENCY` (default PKR), `STORE_COUNTRY` (default PK), and `SHIPPING_MINOR` (integer in minor units). Public environment variables require a rebuild. The current shipping model is a fixed domestic fee. Product prices must include all applicable tax; no tax engine, international delivery zones, or carrier integrations are implemented.
3. Generate a strong `ADMIN_API_TOKEN` of at least 32 characters. Use it at `/admin`. The token is never stored in browser local storage. Admin APIs accept `Authorization: Bearer TOKEN`. Treat this as merchant access for an initial store; organization accounts, MFA, and role-based staff permissions are future work.
4. Upload verified product records using `POST /api/admin/products`. Request fields: `id` (positive integer), `name`, `priceMinor` (positive integer), `stock` (nonnegative integer), `category`, `image`, `color`, `description`, `active` (boolean). Categories: Home & Living, Fashion, Tech, Beauty, Accessories, Grocery, Sports & Fitness. Images currently accept bundled `/product-1.jpg` through `/product-8.jpg`, or an Unsplash `photo-...` identifier. Add your own approved media workflow before expanding inventory. Every product currently has one SKU; size/color variants are not implemented.
5. To enable COD, set `ENABLE_COD=true` after confirming fulfillment and delivery coverage.
6. For cards, connect your eligible Stripe merchant account through deployment secrets: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Configure an HTTPS endpoint at `/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Use Stripe test keys first; never paste production secrets into the repository or chat. Stripe account and currency availability must be verified for your business.
7. Configure `NEXT_PUBLIC_SUPPORT_EMAIL`, verified shipping/return terms, privacy/retention terms, and actual promotion rules. Update homepage copy and the illustrative promotion banner before a public sale. The hero currently contains inactive design offers with a disclaimer.
8. Run the end-to-end launch checks below, then set `STORE_LIVE=true`. Until then checkout returns a clear unavailable response and never creates an order or payment.

## Merchant workflows

`GET /api/admin/orders` returns the latest 100 orders to an authorized merchant. `/admin` can advance confirmed/paid orders to processing, then shipped, then delivered. `PATCH /api/admin/orders` accepts `{ "id": "ORDER_UUID", "status": "processing|shipped|delivered" }` and rejects invalid transitions. Refunds, manual cancellations, returns, tracking numbers, and customer notification emails are not yet implemented; refunds must be managed and reconciled through Stripe before operating a live store.

Cash-on-delivery orders are recorded as confirmed with payment due on delivery. Stripe orders remain awaiting payment until an authenticated webhook verifies paid status, matching amount, and currency. Redirecting to the success page alone never marks an order paid. Expired/failed sessions release reserved inventory once. Monitor webhook delivery and outstanding reservations; automatic recovery for a lost provider response or abandoned pre-session reservation is not yet scheduled.

Newsletter subscriptions are persisted idempotently. Add an email provider, unsubscribe flow, retention controls, and deployment-level rate limiting before enabling promotional mail. Add deployment-level abuse controls for checkout and signup.

## Validation

```sh
npm test
npm run typecheck
npm run build
# In a second terminal, while npm start runs in demo configuration:
node scripts/smoke.mjs
```

Unit checks cover invalid quantities/duplicate items, integer totals, corrupted stored carts, and delivery validation. HTTP checks cover pages, local media, sample catalog, disabled checkout, and unauthorized admin endpoints.

Before live operation, test using a real staging database and Stripe test mode: successful and declined cards, cancelled and expired sessions, delayed and duplicate webhook deliveries, tampered totals, concurrent final-stock purchases, identical request retries, COD order persistence, merchant status transitions, and newsletter persistence. Check the full layout at 320/375/390/768/1440 px and keyboard navigation. Browser rendering and real payment/database integration could not be verified in the creation environment; no zero-defect or production-ready claim is made.

## Design assets

Bundled imagery was extracted from the user-supplied PDF. Confirm rights to the supplied brand/product artwork before public commercial use. Unverified badges were removed from product artwork; the supplied logo was kept unchanged. Sample prices and availability are examples only.

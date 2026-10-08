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
4. Upload verified product records using `POST /api/admin/products`. Request fields: `id` (positive integer), `name`, `priceMinor` (positive integer), `stock` (nonnegative integer), `category`, `image`, `color`, `description`, `active` (boolean). Categories: Home & Living, Fashion, Tech, Beauty, Accessories, Grocery, Sports & Fitness. Images accept bundled `/product-1.jpg` through `/product-8.jpg`, `/products/featured0.webp` through `featured7.webp`, `/products/deal0.webp` through `deal5.webp`, `/products/best0.webp` through `best5.webp`, or an Unsplash `photo-...` identifier. Add your own approved media workflow before expanding inventory. Every product currently has one SKU; size/color variants are not implemented.
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

Before live operation, test using a real staging database and Stripe test mode: successful and declined cards, cancelled and expired sessions, delayed and duplicate webhook deliveries, tampered totals, concurrent final-stock purchases, identical request retries, COD order persistence, merchant status transitions, and newsletter persistence. Check the full layout at 320/375/390/768/1440 px and keyboard navigation. Responsive browser checks have passed at 320–1440 px. Real payment/database integration remains unverified; no zero-defect or production-ready claim is made.

## Design assets

Bundled imagery was extracted from the user-supplied PDF. Confirm rights to the supplied brand/product artwork before public commercial use. Unverified badges were removed from product artwork; the supplied logo was kept unchanged. Sample prices and availability are examples only.

## Product artwork and badges

Catalog card photos are generated product concepts in `public/products/`; they contain no UI badges or hearts. The uploaded logo is copied byte-for-byte to `public/brande-original.png` and shared by header/footer. Product photos must be verified against actual inventory before sale.

Run `npm run db:setup` to apply the idempotent `badge` column migration. Merchant `/admin` → Product badges supports editing or clearing a badge on any database product. Authenticated `GET /api/admin/products` lists badge fields; `PATCH /api/admin/products` takes `{id,badge}`. Labels are at most 24 characters and exclude percentages. Catalog API exposes the saved badge. Demo labels are stored separately from the images; percentage labels are rejected. Design-preview cards use optional labels in `lib/home-content.ts`. Live catalog badges come from the database.

Wishlist hearts work on catalog and design-preview cards and persist in this browser. Product cards have no Buy now or Add to cart controls. Catalog shopping remains available in the product detail dialog. Card typography and spacing adapt across mobile, tablet, and desktop.

## Heading style

Use the main section heading directly. Do not add small orange subheadings, eyebrow labels, or kickers above headings on the homepage or future pages.

## Shop page

`/shop` uses the existing catalog API, original logo, clean photos, homepage fonts and orange/black palette. Search, category selection, price range, color, availability, wishlist filtering and sorting are reflected in URL parameters. The desktop sidebar becomes a keyboard-accessible filter drawer on smaller screens. Active filters can be removed individually; empty and failed-loading states offer recovery. Product cards remain compact and have no purchase buttons. Quick view provides product details and the existing cart flow while the dedicated product page is planned separately.

Homepage Shop navigation, categories and View All Products links lead to the new shop. Wishlist and cart use the same browser storage as the homepage and checkout. All pricing comes from the catalog; demo inventory remains labeled as sample content.

Shop validation includes production browser checks at 320/390/768/1024/1440 px, filters and URL restoration, wishlist persistence, quick view, cart quantities, mobile focus trapping and navigation. Larger catalog, stock filtering, load-more and failed-load recovery were exercised with mocked catalog responses.

## Shared footer

`app/store-footer.tsx` is rendered once by the root layout on every route, including future pages. It preserves the homepage footer markup, original logo, payment artwork and responsive styles. Pages must not create their own footer or override the shared footer layout. Newsletter submission and information dialogs live in the shared component; footer shopping links work across routes.

## Homepage hero

The full-width hero uses three original photographic banner assets in `public/heroes`, with real HTML headings and shop links. Desktop banners are 560–680px tall; mobile places centered copy above the banner artwork. There are no visible arrows or pagination below the banner. Slides rotate every six seconds, pause on hover, keyboard focus or a hidden browser tab, and respect reduced-motion preferences. Keyboard arrows and horizontal touch swipes remain available; a keyboard-focusable pause control is visually hidden until focused.

Banner artwork was generated for everyday essentials (charcoal studio), fashion/accessories (cream studio), and home/tech (neutral home scene), with products composed on the right and negative space on the left. Images contain no embedded text, logos, discounts, badges or buttons. Existing fonts, palette and shared footer are preserved.

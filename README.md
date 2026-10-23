> **Hostinger Business/Cloud:** this release uses MySQL. Follow [the deployment guide](HOSTINGER-DEPLOYMENT.md). PostgreSQL records require a separate data migration; changing environment variables alone does not transfer them.

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
- MySQL schema, live catalog endpoint, product-management API, order-management API and `/admin` order interface.
- Newsletter subscription persistence with explicit consent. Email campaigns/delivery are not connected.
- Demo mode prevents orders and charges until explicitly configured.

## Launch configuration (required)

1. Create a Hostinger MySQL database. Set `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` (see `.env.example` and `HOSTINGER-DEPLOYMENT.md`), then run `npm run db:setup`. This creates tables; it does **not** turn sample items into sellable inventory.
2. Set `STORE_URL` to the exact HTTPS deployment origin. Set `NEXT_PUBLIC_STORE_CURRENCY` (default PKR), `STORE_COUNTRY` (default PK), and `SHIPPING_MINOR` (integer in minor units). Public environment variables require a rebuild. The current shipping model is a fixed domestic fee. Product prices must include all applicable tax; no tax engine, international delivery zones, or carrier integrations are implemented.
3. Set a private `ADMIN_SETUP_TOKEN` of at least 32 characters. Open `/admin` once to create your owner username and password (12–128 characters), then remove the setup token. Subsequent access uses username/password and an eight-hour HttpOnly session. Customer accounts cannot access admin APIs. See `ADMIN-ACCESS.md`.
4. Upload verified product records using `POST /api/admin/products`. Request fields: `id` (positive integer), `name`, `priceMinor` (positive integer), `stock` (nonnegative integer), `category`, `image`, `color`, `description`, `active` (boolean). Categories: Home & Living, Fashion, Tech, Beauty, Accessories, Grocery, Sports & Fitness. Images accept bundled `/product-1.jpg` through `/product-8.jpg`, `/products/featured0.webp` through `featured7.webp`, `/products/deal0.webp` through `deal5.webp`, `/products/best0.webp` through `best5.webp`, or an Unsplash `photo-...` identifier. Add your own approved media workflow before expanding inventory. Every product currently has one SKU; size/color variants are not implemented.
5. To enable COD, set `ENABLE_COD=true` after confirming fulfillment and delivery coverage.
6. For cards, connect your eligible Stripe merchant account through deployment secrets: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Configure an HTTPS endpoint at `/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Use Stripe test keys first; never paste production secrets into the repository or chat. Stripe account and currency availability must be verified for your business.
7. Keep public contact details in `lib/store-contact.ts` up to date, and configure verified shipping/return terms, privacy/retention terms, and actual promotion rules. Update homepage copy and the illustrative promotion banner before a public sale. The hero currently contains inactive design offers with a disclaimer.
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

`/shop` uses the existing catalog API, original logo, clean photos, homepage fonts and orange/black palette. Search, category selection, price range, color, availability, wishlist filtering and sorting are reflected in URL parameters. The desktop sidebar becomes a keyboard-accessible filter drawer on smaller screens. Active filters can be removed individually; empty and failed-loading states offer recovery. Product cards remain compact and have no purchase buttons. Product images and names now open the dedicated product page; the shared header bag action opens `/cart`.

Homepage Shop navigation, categories and View All Products links lead to the new shop. Wishlist and cart use the same browser storage as the homepage and checkout. All pricing comes from the catalog; demo inventory remains labeled as sample content.

Shop validation includes production browser checks at 320/390/768/1024/1440 px, filters and URL restoration, wishlist persistence, quick view, cart quantities, mobile focus trapping and navigation. Larger catalog, stock filtering, load-more and failed-load recovery were exercised with mocked catalog responses.

## Shared footer

`app/store-footer.tsx` is rendered once by the root layout on every route, including future pages. It preserves the homepage footer markup, original logo, payment artwork and responsive styles. Pages must not create their own footer or override the shared footer layout. Newsletter submission and information dialogs live in the shared component; footer shopping links work across routes.

## Homepage hero

The full-width hero uses three original photographic banner assets in `public/heroes`, with real HTML headings and shop links. Desktop banners are 560–680px tall; mobile places centered copy above the banner artwork. There are no visible arrows or pagination below the banner. Slides rotate every six seconds, pause on hover, keyboard focus or a hidden browser tab, and respect reduced-motion preferences. Keyboard arrows and horizontal touch swipes remain available; a keyboard-focusable pause control is visually hidden until focused.

Banner artwork was generated for everyday essentials (charcoal studio), fashion/accessories (cream studio), and home/tech (neutral home scene), with products composed on the right and negative space on the left. Images contain no embedded text, logos, discounts, badges or buttons. Existing fonts, palette and shared footer are preserved.

## Shop opening and shared header

The shop opening follows the supplied reference: a category sidebar, cream skincare banner with a real HTML heading and Beauty button, four working shopping shortcuts, and circular category links. Category names, counts and photos come from the catalog. Category shortcuts clear previous filters before selecting the collection; detailed filters, URL restoration, wishlist, product navigation and bag behavior remain available below the opening. Mobile displays departments in a horizontal strip and places the banner image below centered copy.

`app/store-header.tsx` is shared by the homepage and shop. It keeps the original logo, existing fonts and orange palette, and adds a prominent product search, compact wishlist/bag actions, a second navigation row and a collection dropdown. Search from the homepage opens the shop; shop search filters its catalog. The mobile navigation works by tapping, and menus support keyboard dismissal and outside-click closing. Keep using this header for future store browsing pages and the root layout's shared footer.

The new asset `public/heroes/shop-beauty.webp` was created with the built-in image-generation tool. Prompt: premium realistic skincare still life on pale travertine platforms, amber and frosted serum bottles, ivory jars and a succulent; cream #fff5ef backdrop with natural daylight, products on the right, negative space on the left, wide 2.2:1 composition; no embedded text, logos, labels, discounts, badges, buttons or UI. Source image remains unmodified; the project uses a WebP export.


## Product, cart, checkout and confirmation

`/product/[id]` loads verified live products on the server, or existing design samples when the store is not live. It provides a large accessible image preview, quantity limits, an Add to Bag action, wishlist control, product details and related products. Images and names on homepage/shop cards link here. Negative sample references are unavailable for purchase and have no invented local-currency price. Product cards keep their existing rule: no purchase buttons.

`/cart` and `/checkout` follow the supplied PDF arrangement, with item lists/grouped information on the left and an order summary on the right; these stack responsively. Cart quantities, removal and favorites share the existing browser storage. Checkout includes customer details, address type, province, optional apartment/alternate phone/landmark/notes, delivery options and payment choices. Only backend-configured payment methods can be selected. Express delivery, bank transfer and mobile wallet remain unavailable until implemented. No coupon, discount, tax or delivery-time claims are invented. Existing server-side inventory checks, integer price calculation, idempotency and setup-disabled ordering are preserved.

`/order` displays a receipt, customer/address data and status from the server. COD receipt access requires the order ID and its unguessable checkout request key; Stripe receipt access uses the existing opaque session capability. Invalid access receives no order data. Pending and failed verification never render a confirmed payment. Delivery stages reflect actual order status, with no fabricated delivery dates or email promises. Refresh Order Status reloads the receipt. Revisiting an older receipt preserves a newly created cart; only a matching in-progress payment order clears its bag on confirmation.

The PDF has flattened images without embedded font metadata. `app/heading-style.css` matches its “Your Shopping Cart” bold serif heading appearance using Georgia/Times fallbacks and applies it to all heading levels. Body typography stays DM Sans. Existing colors, original logo, shared header structure and shared footer are retained.

Validation: production build and five commerce unit tests pass. Browser checks cover the four pages at 320, 390, 768, 1024, 1440 and 1920px, one shared header/footer, product navigation and image preview, favorites, stock-limited quantities, persistent cart edits, setup-disabled ordering, optional checkout fields, receipt access rejection, and mocked confirmed/pending/failed order states. Real database writes and payment collection were not exercised; live ordering remains dependent on the existing merchant configuration.

## Product category pages

`/category/[slug]` uses the shared store header/footer, current bold serif headings, cream/orange/black palette and compact product cards. Each collection has its own introduction and existing high-resolution banner, a collection navigation strip and the shop's product filtering tools. On mobile, the banner artwork sits below centered copy, the current collection is brought into view in the horizontal navigation, and filters use the existing accessible drawer.

The selected collection stays fixed while shoppers search, change price/color/availability/wishlist filters, sort, reload or clear filters. Colors come from that collection's catalog. Query parameters retain these filter choices without turning the category page into the general shop. Header collection links, homepage categories, shop category shortcuts and product category links open the dedicated routes. Existing multi-category `/shop` links remain supported.

Category names come from the configured departments plus active live inventory. Empty collections provide a link back to the shop; unknown routes render a branded 404. New named collections can use the same route template without creating another page file. Existing banner assets are reused without changing their contents, and all headings/buttons remain real website elements.

Category validation: production build and commerce tests pass. Browser checks cover five stocked collections at 320/390/768/1024/1440/1920px, category-only results, category lock/reset and URL restoration, search/sorting/price/color/wishlist filters, mobile drawer focus and Escape, navigation from homepage/header/shop/product, empty and unknown collections, failed catalog recovery and legacy multi-category shop URLs.

## Compact client-reference styling

`app/product-card.tsx` is shared by homepage catalog products, shop/category results and recommendations. It uses the same catalog name, price and currency on every page, a shorter image area, regular-weight titles, subtle bottom shadow, real wishlist control and rounded badge variants. Star Seller badges are purple, normal badges orange and stock-zero badges red. No purchase buttons or percentage discounts appear on cards. Design-only negative product references are labeled samples with price to be confirmed, rather than pretending to be catalog inventory.

Fixed sample ratings, sales counts and countdowns were removed from the card presentation. Ratings render only with a valid `rating` and positive `reviewCount`; sales counts require positive `soldCount`. Low-stock text uses live stock. Optional database columns `rating`, `review_count` and `sold_count` are defined in the schema and surfaced by the catalog/product loaders. Run the existing database setup/migration before importing verified statistics; no production database migration was executed during this design change.

The shared header now uses one desktop navigation row and an expandable search field. Mobile keeps the original logo centered and provides a safe-area-aware fixed bar for Home, Categories, Search, Wishlist and Cart. Categories and Search open real navigation/search controls; there is no placeholder Account link. The bar leaves room below page/footer content and sits behind modal overlays.

`app/compact-store.css` reduces category tile height, section spacing, footer logo/type sizes and footer padding. Blog cards use smaller image/caption proportions. The three homepage banners remain automatically rotating, with a compact horizontal text/image composition on mobile. Collection promotions use clean existing photographs with real headings/links instead of embedded discount artwork. The serif heading style and original logo are preserved.

Category artwork: `public/categories/electronics.webp`, `fashion.webp`, `grocery.webp`, `home.webp` and `fitness.webp` are new transparent cutouts made with the built-in image-generation tool. Prompt set: realistic matte-black headphones, cognac handbag, grocery bag with fresh produce, cream electric kettle and black fitness watch; centered square studio photography, full object visible, transparent background, no text/logos/badges/buttons, designed for pastel category tiles. Originals remain unmodified; 512px WebP exports retain transparency.

Compact-style validation: production build and five commerce tests pass. Browser checks span 320/390/768/1024/1440/1920px on homepage, shop, category, product, cart and checkout. They check no horizontal overflow, shared header/footer, compact header sizes, mobile navigation and modal behavior, catalog price consistency, persistent hearts, expandable search, badge variants and optional-statistics fixtures. Category filter/search/sort/URL restoration and navigation regressions are also checked. New cutouts retain alpha transparency and are used only as category decoration, not replacement catalog product photography.


## Product management and customer accounts

Open `/admin` directly for product editing, inventory, uploads, order processing and customer records. Admin access uses a separate admin username/password and protected session; no public navigation link is added. Customer login, registration, profile editing and private order history are at `/account`.

Before live activation, apply the additive database schema and configure email and social providers as described in [Account and admin setup](database/accounts-and-admin.md). Products from the configured database can be previewed while `STORE_LIVE=false`; this does not enable checkout.


## Inventory, orders and journal workspace

The private `/admin` workspace now includes overview metrics, SKU/cost/location/reorder management, stock adjustment history, supplier purchase orders and receiving, searchable order fulfilment with notes/tracking/printing, and a rich journal editor with drafts, schedules, media, SEO fields and revisions. Apply `database/admin-workspace.sql` to existing installations before deploying. See [ADMIN-WORKSPACE.md](ADMIN-WORKSPACE.md) for setup, supported workflows and limits.

The latest private console adds a desktop sidebar, always-visible mobile Blogs navigation, managed Categories/Brands/Tags and a complete product editor for existing store features. See [ADMIN-CONSOLE.md](ADMIN-CONSOLE.md) for database readiness recovery and deployment instructions.

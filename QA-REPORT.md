# Store QA report

Date: 13 October 2026

Base commit: e18dd552f22cacb3216aa20b4c1e4363a6be49d2

## Result

Functional and responsive checks passed in the local production build. Accessibility contrast issues remain. This is not a live Hostinger deployment sign-off or a complete accessibility certification.

## Coverage and evidence

| Check | Result |
| --- | --- |
| Unit tests | 10 passed |
| Admin/account integration suite | Passed using isolated temporary PostgreSQL-compatible test data |
| Responsive storefront | 106 page/viewport combinations passed |
| Widths | 320, 390, 768, 1024, 1440 and 1920 pixels |
| Internal URLs | 51 checked; none returned an error status |
| Images and layout | No broken images, horizontal page overflow or overlapping header controls detected |
| Browser JavaScript | No uncaught errors detected in storefront checks |
| Shared layout | One header and footer per tested page; no product-card purchase or favorite controls |
| Accessibility | Eight desktop routes audited with axe; color-contrast violations found, no other rule violations detected in that sample |

Core pages included home, shop, categories, product, cart, checkout, order confirmation, blog, account and admin. Supporting pages included contact, FAQ, shipping, returns, policies, payments, size guide, order tracking, accessibility and disclaimer.

Functional checks covered sorting, filtering, search, favorites persistence, cart quantities, Buy Now navigation, checkout field requirements, image zoom, mobile menus, filter dismissal, category animation, hero autoplay and hover pause.

Integration checks covered verified email signup, login, password recovery, session invalidation, profile editing, private order access, guest order proof linking, checkout retry/stock handling, admin authorization, product CRUD/archive, media validation, inventory, order processing and tracking. Origin checks, throttling and invalid OAuth state were exercised. OAuth and email responses were mocked; no real outbound email or production customer data was used.

## Fixes included

Product help, cart help and order support links now open `/contact` instead of the homepage footer anchor. Existing styling is unchanged.

## Remaining findings

1. **Accessibility: text contrast.** Small brand-orange text on white has approximately 3.26:1 contrast, below the 4.5:1 requirement for normal text. Affected examples include active navigation, small links, badges and some price labels. Some gray text on pale backgrounds also falls below 4.5:1. The approved palette was retained during QA. A follow-up should improve foreground/background combinations or qualifying text sizing/weight while retaining the store identity. Mobile accessibility requires a separate full audit.
2. **Deployment verification pending.** Repeat smoke tests on the actual Hostinger domain after configuring HTTPS, PostgreSQL, environment variables and migrations. Verify real email delivery, Google/Facebook callbacks, media persistence and genuine payment flows with provider sandbox credentials before enabling live checkout.
3. **Merchant information pending.** Preview/demo contact details, policy content and provider configuration need owner verification before launch. QA cannot establish their business accuracy.

## Reproduction

Run `npm test`, `npm run build`, and the documented integration suite in `tests/integration/management.cjs`. The extended storefront audit was run with Playwright Chromium and axe against the local production server. External Google Fonts CSS was mocked for browser tests, so these checks do not verify live font delivery. This pass used Chromium only; Safari and Firefox/device testing remains outstanding.

See `HOSTINGER-DEPLOYMENT.md` for deployment and launch steps.

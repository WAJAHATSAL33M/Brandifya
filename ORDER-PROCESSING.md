# Brand E order processing

## Deploy and activate

1. Deploy the latest main branch using `npm run build:hostinger`, which applies the full additive schema before building. Existing store records are preserved.
2. For an existing deployment, Admin → Settings → Finish database setup also adds the order email queue. Alternatively import `database/order-processing.sql` into the same store database in phpMyAdmin. The complete schema now contains 25 tables.
3. In Hostinger, set `STORE_URL` to the canonical HTTPS domain and verify the database connection. Set `SHIPPING_MINOR` to the approved integer delivery charge in minor units. Keep `NEXT_PUBLIC_STORE_CURRENCY=PKR` and `STORE_COUNTRY=PK` unless the merchant intentionally changes them.
4. Enable the payment methods the merchant actually accepts. `ENABLE_COD=true` enables cash on delivery. Card checkout requires both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`; configure `/api/webhooks/stripe` for completed, asynchronous-success, asynchronous-failure and expired Checkout Session events. Use a merchant account eligible for the chosen provider.
5. Configure `RESEND_API_KEY` and a verified `AUTH_FROM_EMAIL`. Email is optional for checkout; a missing sender or delivery failure does not invalidate an accepted order. It leaves notification jobs queued.
6. Publish real products with stock from Admin → Products. Importing the schema does not publish demonstration inventory. Review delivery and return arrangements before launch.
7. Set `STORE_LIVE=true` and restart/redeploy to accept orders. The admin Orders view shows whether checkout, COD, cards and order emails are enabled. Public checkout uses a normal paused-service message when checkout is intentionally disabled.

## Fulfillment workflow

- A COD order starts **Confirmed**. Its items and prices are recorded and stock is reserved once. A confirmation event and optional customer email are recorded in the same transaction.
- A card order starts **Awaiting payment**. Only a signed webhook matching the order, payment amount, currency and Checkout Session marks it **Paid**. Duplicate webhook deliveries do not duplicate status events or email jobs. Failed or expired pending sessions restore stock once.
- Admin → Orders: open an order and move it to **Processing**, save the courier number and HTTPS tracking URL, then mark **Shipped**, then **Delivered**. Each transition is checked on the server and recorded in customer-visible history.
- Unshipped COD orders can be cancelled by admin; stock is restored once. Delivered orders cannot be cancelled through this action. Card refunds must be handled with the payment provider; marking a status is not a refund.
- Customers can print/save a receipt on the order confirmation page. This is an order receipt, not a tax invoice or proof of a pending card payment.
- Customers track with `/order-tracking` using their full reference and checkout phone/email, a saved private confirmation, or their signed-in account. Carrier links open the carrier's website; courier scan synchronization is a separate integration.

## Customer notifications

`order_notifications` stores a unique job per order/status when a valid checkout email is present. The queue commits alongside the order change. Sending runs after the response, so an email-provider outage does not turn a successful order into a failed checkout. Failed jobs use increasing delays and stop automatic attempts after eight failures. Resend requests use stable idempotency keys; provider deduplication has its own retention window.

Admin order details show sent/queued/failed status. **Process pending emails** retries failed jobs and processes up to five eligible messages. Sent jobs are not reset. The action requires an authenticated admin and same-origin request.

For unattended retries, run `npm run orders:send` from the deployed project using a private server scheduler where supported, for example every five minutes. The command processes up to 50 eligible jobs per run and uses environment variables from the deployment or private `.env.local`. Never put API keys in a public URL or commit them. Without a scheduler, subsequent order activity and the admin retry action also drain eligible jobs.

## Validation

Use a dedicated test database, not production: `npm run test:workspace` with `TEST_DATABASE_URL` pointing to a new empty database ending `_test`. Tests cover idempotent order placement, fulfillment transitions, stock restoration, signed payment confirmations, webhook replay and session mismatch, account ownership and guest tracking, email queue access and deduplication. Unit checks run with `npm test`.

# Product merchandising
The shared product card and product page consume the same catalog fields.
- badge: Featured, New Arrival, Best Seller, Top Rated, Star Seller, or a scheduled promotion label.
- stock: 0 displays Sold Out; live stock from 1 to 3 displays the exact remaining count.
- rating and review_count: verified aggregate rating; no stars without a positive review count.
- sold_count: actual positive sales count. Low-stock information takes priority in the compact card metadata slot.
- promotion_active, promotion_starts_at, promotion_ends_at: optional scheduled offers. Apply database/schema.sql before configuring these fields. Dates must form a valid interval; enabled offers show only during that interval and expire without restarting.
No production migration is executed by this source change. Existing rows remain compatible: missing promotion fields are inactive.
Supply verified trust badges through the existing product badge field; they are never inferred from demo ratings. People-in-carts claims are suppressed until an actual count integration exists.
Primary buttons retain #FF5100. Buy Now adds the selected quantity and opens /cart; the icon adds without navigating. Cards have no purchase buttons or favorite hearts.

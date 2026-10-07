CREATE TABLE IF NOT EXISTS products (
 id integer PRIMARY KEY, name text NOT NULL, price_minor integer NOT NULL CHECK(price_minor>0), currency text NOT NULL DEFAULT 'PKR', stock integer NOT NULL CHECK(stock>=0), active boolean NOT NULL DEFAULT false, category text NOT NULL DEFAULT 'Accessories', image text NOT NULL DEFAULT '', color text NOT NULL DEFAULT '', description text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY, request_key uuid NOT NULL UNIQUE, request_fingerprint text NOT NULL, status text NOT NULL CHECK(status IN ('awaiting_payment','confirmed','paid','processing','shipped','delivered','cancelled')), payment_method text NOT NULL CHECK(payment_method IN ('cod','stripe')), currency text NOT NULL, total_minor integer NOT NULL CHECK(total_minor>0), shipping_minor integer NOT NULL CHECK(shipping_minor>=0), customer jsonb NOT NULL, stripe_session_id text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
 order_id uuid NOT NULL REFERENCES orders(id), product_id integer NOT NULL REFERENCES products(id), name text NOT NULL, price_minor integer NOT NULL CHECK(price_minor>0), quantity integer NOT NULL CHECK(quantity>0), PRIMARY KEY(order_id,product_id)
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE TABLE IF NOT EXISTS newsletter (email text PRIMARY KEY, subscribed_at timestamptz NOT NULL DEFAULT now());

ALTER TABLE products ADD COLUMN IF NOT EXISTS badge text NOT NULL DEFAULT '';

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


-- Optional verified merchandising statistics. Zero reviews hide rating UI.
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating numeric(2,1) CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0 CHECK (sold_count >= 0);

-- Optional scheduled promotions; inactive until explicitly configured.
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_active boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_starts_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotion_ends_at timestamptz;

-- Optional comparison price. price_minor remains the amount charged.
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price_minor integer CHECK (original_price_minor > 0);

-- Customer accounts and private order ownership.
CREATE TABLE IF NOT EXISTS customers (
 id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, password_hash text,
 email_verified boolean NOT NULL DEFAULT false, phone text NOT NULL DEFAULT '', address text NOT NULL DEFAULT '',
 city text NOT NULL DEFAULT '', postal_code text NOT NULL DEFAULT '', country text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customer_sessions (token_hash text PRIMARY KEY,customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS customer_identities (provider text NOT NULL,subject text NOT NULL,customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,PRIMARY KEY(provider,subject));
CREATE TABLE IF NOT EXISTS account_tokens (token_hash text PRIMARY KEY,customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,purpose text NOT NULL,email text NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_states (state_hash text PRIMARY KEY,provider text NOT NULL,verifier text NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS auth_limits (key text PRIMARY KEY,count integer NOT NULL,expires_at timestamptz NOT NULL);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id,created_at DESC);
CREATE TABLE IF NOT EXISTS order_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,order_id uuid NOT NULL REFERENCES orders(id),status text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE products ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS product_media (id uuid PRIMARY KEY,mime_type text NOT NULL,content bytea NOT NULL,created_at timestamptz NOT NULL DEFAULT now());


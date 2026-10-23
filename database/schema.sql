-- Hostinger MySQL 8+ / MariaDB 10.6+. Import into a newly created, selected database.
-- Re-running this file preserves existing tables and records. InnoDB is required.
CREATE TABLE IF NOT EXISTS products (
 id INT PRIMARY KEY,
 name VARCHAR(1000) NOT NULL,
 price_minor INT NOT NULL CHECK (price_minor > 0),
 original_price_minor INT NULL CHECK (original_price_minor > 0),
 currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
 stock INT NOT NULL CHECK (stock >= 0),
 active BOOLEAN NOT NULL DEFAULT FALSE,
 category VARCHAR(120) NOT NULL DEFAULT 'Accessories',
 image VARCHAR(2048) NOT NULL DEFAULT '',
 color VARCHAR(120) NOT NULL DEFAULT '',
 description TEXT NOT NULL,
 badge VARCHAR(120) NOT NULL DEFAULT '',
 rating DECIMAL(2,1) NULL CHECK (rating BETWEEN 0 AND 5),
 review_count INT NOT NULL DEFAULT 0 CHECK (review_count >= 0),
 sold_count INT NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
 promotion_active BOOLEAN NOT NULL DEFAULT FALSE,
 promotion_starts_at DATETIME(3) NULL,
 promotion_ends_at DATETIME(3) NULL,
 media JSON NULL,
 attributes JSON NULL,
 INDEX products_active_category_idx (active, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS customers (
 id CHAR(36) PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NULL, email_verified BOOLEAN NOT NULL DEFAULT FALSE,
 phone VARCHAR(30) NOT NULL DEFAULT '', address VARCHAR(300) NOT NULL DEFAULT '',
 city VARCHAR(120) NOT NULL DEFAULT '', postal_code VARCHAR(20) NOT NULL DEFAULT '', country VARCHAR(2) NOT NULL DEFAULT '',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS orders (
 id CHAR(36) PRIMARY KEY, request_key CHAR(36) NOT NULL UNIQUE, request_fingerprint CHAR(64) NOT NULL,
 status VARCHAR(24) NOT NULL CHECK (status IN ('awaiting_payment','confirmed','paid','processing','shipped','delivered','cancelled')),
 payment_method VARCHAR(12) NOT NULL CHECK (payment_method IN ('cod','stripe')),
 currency VARCHAR(3) NOT NULL, total_minor INT NOT NULL CHECK (total_minor > 0), shipping_minor INT NOT NULL CHECK (shipping_minor >= 0),
 customer JSON NOT NULL, stripe_session_id VARCHAR(255) NULL UNIQUE, customer_id CHAR(36) NULL,
 tracking_number VARCHAR(100) NOT NULL DEFAULT '', tracking_url VARCHAR(2048) NOT NULL DEFAULT '',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX orders_created_idx (created_at), INDEX orders_customer_idx (customer_id, created_at),
 FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS order_items (
 order_id CHAR(36) NOT NULL, product_id INT NOT NULL, name VARCHAR(1000) NOT NULL,
 price_minor INT NOT NULL CHECK (price_minor > 0), quantity INT NOT NULL CHECK (quantity > 0),
 PRIMARY KEY (order_id, product_id), FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS newsletter (email VARCHAR(254) PRIMARY KEY, subscribed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS customer_sessions (
 token_hash CHAR(64) PRIMARY KEY, customer_id CHAR(36) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), expires_at DATETIME(3) NOT NULL,
 INDEX sessions_expiry_idx (expires_at), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS customer_identities (
 provider VARCHAR(24) NOT NULL, subject VARCHAR(191) NOT NULL, customer_id CHAR(36) NOT NULL,
 PRIMARY KEY (provider, subject), FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS account_tokens (
 token_hash CHAR(64) PRIMARY KEY, customer_id CHAR(36) NOT NULL, purpose VARCHAR(24) NOT NULL,
 email VARCHAR(254) NOT NULL, expires_at DATETIME(3) NOT NULL,
 FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS oauth_states (
 state_hash CHAR(64) PRIMARY KEY, provider VARCHAR(24) NOT NULL, verifier VARCHAR(128) NOT NULL, expires_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS auth_limits (
 bucket_key CHAR(64) PRIMARY KEY, count INT NOT NULL, expires_at DATETIME(3) NOT NULL, INDEX limits_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS order_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id CHAR(36) NOT NULL, status VARCHAR(24) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX events_order_idx (order_id, created_at),
 FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS product_media (
 id CHAR(36) PRIMARY KEY, mime_type VARCHAR(100) NOT NULL, content LONGBLOB NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS transaction_locks (lock_key CHAR(64) PRIMARY KEY) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Import into the EXISTING store database. Does not modify products, customers or orders.
CREATE TABLE IF NOT EXISTS admin_users (
 id CHAR(36) PRIMARY KEY,
 username VARCHAR(64) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role VARCHAR(16) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin')),
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 last_login_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 admin_id CHAR(36) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 expires_at DATETIME(3) NOT NULL,
 INDEX admin_session_expiry_idx (expires_at),
 FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Safe additive upgrade for the existing Hostinger store database.
CREATE TABLE IF NOT EXISTS product_inventory (
 product_id INT PRIMARY KEY, sku VARCHAR(100) NULL UNIQUE, supplier VARCHAR(200) NOT NULL DEFAULT '',
 location VARCHAR(120) NOT NULL DEFAULT '', cost_minor INT NOT NULL DEFAULT 0 CHECK(cost_minor>=0),
 reorder_level INT NOT NULL DEFAULT 3 CHECK(reorder_level>=0), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS inventory_movements (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, delta INT NOT NULL,
 stock_after INT NOT NULL, reason VARCHAR(300) NOT NULL, reference VARCHAR(100) NOT NULL DEFAULT '',
 actor VARCHAR(64) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX movement_product_idx(product_id,created_at), FOREIGN KEY(product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS purchase_orders (
 id CHAR(36) PRIMARY KEY, supplier VARCHAR(200) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ordered',
 expected_at DATE NULL, notes TEXT NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 received_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS purchase_order_items (
 purchase_id CHAR(36) NOT NULL, product_id INT NOT NULL, quantity INT NOT NULL CHECK(quantity>0),
 cost_minor INT NOT NULL CHECK(cost_minor>=0), PRIMARY KEY(purchase_id,product_id),
 FOREIGN KEY(purchase_id) REFERENCES purchase_orders(id), FOREIGN KEY(product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS order_notes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, order_id CHAR(36) NOT NULL, note TEXT NOT NULL,
 actor VARCHAR(64) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS blog_posts (
 id CHAR(36) PRIMARY KEY, slug VARCHAR(180) NOT NULL UNIQUE, origin_slug VARCHAR(180) NULL UNIQUE, title VARCHAR(240) NOT NULL,
 excerpt TEXT NOT NULL, content MEDIUMTEXT NOT NULL, cover_url VARCHAR(2048) NOT NULL DEFAULT '',
 cover_alt VARCHAR(200) NOT NULL DEFAULT '', category VARCHAR(100) NOT NULL DEFAULT 'Journal', tags VARCHAR(500) NOT NULL DEFAULT '',
 author VARCHAR(120) NOT NULL DEFAULT 'Brand E editorial team', status VARCHAR(20) NOT NULL DEFAULT 'draft',
 publish_at DATETIME(3) NULL, seo_title VARCHAR(240) NOT NULL DEFAULT '', seo_description VARCHAR(320) NOT NULL DEFAULT '',
 version INT NOT NULL DEFAULT 1, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX blog_status_publish_idx(status,publish_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS blog_revisions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_id CHAR(36) NOT NULL, snapshot JSON NOT NULL,
 actor VARCHAR(64) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

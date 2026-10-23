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

-- Additive upgrade. Apply after admin-workspace.sql or use the admin setup screen.
CREATE TABLE IF NOT EXISTS catalog_terms (
 id INT AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(16) NOT NULL CHECK(kind IN ('category','brand','tag')),
 name VARCHAR(100) NOT NULL, slug VARCHAR(140) NOT NULL, description TEXT NOT NULL,
 image VARCHAR(2048) NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY catalog_kind_slug(kind,slug), UNIQUE KEY catalog_kind_name(kind,name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS product_details (
 product_id INT PRIMARY KEY, category_id INT NULL, brand_id INT NULL, tag_ids JSON NOT NULL,
 status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
 vendor VARCHAR(200) NOT NULL DEFAULT '', barcode VARCHAR(100) NOT NULL DEFAULT '',
 weight_grams INT NOT NULL DEFAULT 0 CHECK(weight_grams>=0), requires_shipping BOOLEAN NOT NULL DEFAULT TRUE,
 seo_title VARCHAR(200) NOT NULL DEFAULT '', seo_description VARCHAR(320) NOT NULL DEFAULT '',
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(product_id) REFERENCES products(id), FOREIGN KEY(category_id) REFERENCES catalog_terms(id), FOREIGN KEY(brand_id) REFERENCES catalog_terms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

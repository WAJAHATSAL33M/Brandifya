-- Additive migration for order confirmation and fulfillment email delivery.
CREATE TABLE IF NOT EXISTS order_notifications (
 id CHAR(36) PRIMARY KEY,
 order_id CHAR(36) NOT NULL,
 status VARCHAR(24) NOT NULL,
 recipient VARCHAR(254) NOT NULL,
 subject VARCHAR(255) NOT NULL,
 body TEXT NOT NULL,
 attempts INT NOT NULL DEFAULT 0,
 available_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 sent_at DATETIME(3) NULL,
 last_error VARCHAR(200) NOT NULL DEFAULT '',
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY order_notification_status(order_id,status),
 INDEX notification_queue(sent_at,available_at),
 FOREIGN KEY(order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

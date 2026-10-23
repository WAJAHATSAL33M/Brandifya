import mysql from 'mysql2/promise';
import { databaseOptions } from '../lib/database-config.mjs';
const connection = await mysql.createConnection(databaseOptions());
try {
  const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS database_name');
  const tables = ['products','customers','orders','order_items','newsletter','customer_sessions','customer_identities','account_tokens','oauth_states','auth_limits','order_events','product_media','transaction_locks','admin_users','admin_sessions','product_inventory','inventory_movements','purchase_orders','purchase_order_items','order_notes','blog_posts','blog_revisions'];
  for (const table of tables) await connection.query('SELECT 1 FROM `' + table + '` LIMIT 1');
  console.log('Connected. Database engine:', rows[0].version, '— all 22 required tables are accessible.');
} finally { await connection.end(); }

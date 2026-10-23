import mysql from "mysql2/promise";
import { databaseOptions } from "./database-config.mjs";
// Trusted additive statements only. Never execute request-provided SQL.
export const adminAccessStatements: readonly string[] = [
  "CREATE TABLE IF NOT EXISTS admin_users (\n id CHAR(36) PRIMARY KEY,\n username VARCHAR(64) NOT NULL UNIQUE,\n password_hash VARCHAR(255) NOT NULL,\n role VARCHAR(16) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','admin')),\n active BOOLEAN NOT NULL DEFAULT TRUE,\n created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n last_login_at DATETIME(3) NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  "CREATE TABLE IF NOT EXISTS admin_sessions (\n token_hash CHAR(64) PRIMARY KEY,\n admin_id CHAR(36) NOT NULL,\n created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),\n expires_at DATETIME(3) NOT NULL,\n INDEX admin_session_expiry_idx (expires_at),\n FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  "CREATE TABLE IF NOT EXISTS auth_limits (\n bucket_key CHAR(64) PRIMARY KEY, count INT NOT NULL, expires_at DATETIME(3) NOT NULL, INDEX limits_expiry_idx (expires_at)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
  "CREATE TABLE IF NOT EXISTS transaction_locks (lock_key CHAR(64) PRIMARY KEY) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
];
export async function prepareAdminAccess() {
  const connection = await mysql.createConnection(databaseOptions());
  try {
    for (const statement of adminAccessStatements) await connection.query(statement);
  } finally { await connection.end(); }
}
export function databaseErrorCode(error: unknown): string | undefined {
  let current = error;
  for (let depth=0; depth<5 && current && typeof current === 'object'; depth++) {
    if ('code' in current && typeof current.code === 'string') return current.code;
    current = 'cause' in current ? current.cause : undefined;
  }
}
export function adminDatabaseMessage(error: unknown) {
  const code = databaseErrorCode(error);
  if (code === 'ER_ACCESS_DENIED_ERROR' || code === 'ER_DBACCESS_DENIED_ERROR') return 'Database login was rejected. Check DB_USER, DB_PASSWORD and database permissions in Hostinger. If DATABASE_URL is set, it overrides the separate DB settings.';
  if (code === 'ER_BAD_DB_ERROR') return 'The configured database does not exist. Check DB_NAME or the database name in DATABASE_URL.';
  if (['ECONNREFUSED','ETIMEDOUT','ENOTFOUND','EHOSTUNREACH'].includes(code || '')) return 'Cannot reach the database. Check DB_HOST, DB_PORT and database network access in Hostinger.';
  if (code === 'ER_TABLEACCESS_DENIED_ERROR') return 'The database user lacks table permissions. Grant the store user access to the selected database, or import database/admin-access.sql with phpMyAdmin.';
  if (code === 'ER_NO_SUCH_TABLE') return 'Admin tables are missing. Reload this page and use Repair admin access, or import database/admin-access.sql into the configured store database.';
  return 'Admin database check failed. Verify the Hostinger MySQL settings and import database/admin-access.sql into the same database used by this app.';
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseOptions, databaseConfigured } from '../lib/database-config.mjs';
test('Hostinger MySQL configuration accepts separate credentials and encoded URLs', () => {
  assert.equal(databaseConfigured({}), false);
  const options = databaseOptions({ DB_NAME: 'account_store', DB_USER: 'account_user', DB_PASSWORD: 'p@ss#word' });
  assert.equal(options.host, '127.0.0.1');assert.equal(options.port, 3306);assert.equal(options.password, 'p@ss#word');
  const url = databaseOptions({ DATABASE_URL: 'mysql://account_user:p%40ss%23word@127.0.0.1:3307/account_store' });
  assert.equal(url.password, options.password);assert.equal(url.port, 3307);
  assert.throws(() => databaseOptions({ DATABASE_URL: 'postgresql://user:pass@host/db' }), /mysql/);
  assert.throws(() => databaseOptions({ DB_NAME:'db', DB_USER:'user', DB_PASSWORD:'password', DB_PORT:'NaN' }), /port/);
});
test('remote TLS verifies certificates and never disables verification', () => {
  const options = databaseOptions({ DB_NAME:'db', DB_USER:'user', DB_PASSWORD:'pass', DB_SSL:'true', DB_SSL_CA:'line1\\nline2' });
  assert.equal(options.ssl?.rejectUnauthorized, true);assert.equal(options.ssl?.ca, 'line1\nline2');
  assert.throws(() => databaseOptions({ DB_NAME:'db', DB_USER:'user', DB_PASSWORD:'pass', DB_SSL:'optional' }), /DB_SSL/);
});

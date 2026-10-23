import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adminAccessStatements, databaseErrorCode, adminDatabaseMessage } from '../lib/admin-bootstrap.ts';
import { storeOrigin } from '../lib/store-origin.ts';

test('admin repair statements match the additive phpMyAdmin import', () => {
  const sql = readFileSync(new URL('../database/admin-access.sql', import.meta.url), 'utf8')
    .split('\n').filter(line => !line.startsWith('--')).join('\n')
    .split(';').map(statement => statement.trim()).filter(Boolean);
  assert.deepEqual(adminAccessStatements, sql);
  assert.equal(sql.length, 4);
  assert.ok(sql.every(statement => statement.startsWith('CREATE TABLE IF NOT EXISTS')));
});
test('database diagnostics identify wrapped causes without exposing driver details', () => {
  for (const code of ['ER_ACCESS_DENIED_ERROR','ER_BAD_DB_ERROR','ECONNREFUSED','ER_TABLEACCESS_DENIED_ERROR','ER_NO_SUCH_TABLE']) {
    const error = new Error('private connection string', {cause: Object.assign(new Error('private SQL'), {code})});
    assert.equal(databaseErrorCode(error), code);
    assert.doesNotMatch(adminDatabaseMessage(error), /private/);
  }
  assert.match(adminDatabaseMessage({code:'ER_ACCESS_DENIED_ERROR'}), /DB_PASSWORD/);
  assert.match(adminDatabaseMessage({code:'ECONNREFUSED'}), /DB_HOST/);
});
test('missing or insecure STORE_URL is detected separately from the database', () => {
  const previous = process.env.STORE_URL;
  try {
    delete process.env.STORE_URL;
    assert.throws(storeOrigin, /Store URL/);
    process.env.STORE_URL = 'http://store.example.com';
    assert.throws(storeOrigin, /HTTPS/);
    process.env.STORE_URL = 'https://store.example.com/';
    assert.equal(storeOrigin(), 'https://store.example.com');
  } finally {
    if (previous === undefined) delete process.env.STORE_URL;
    else process.env.STORE_URL = previous;
  }
});

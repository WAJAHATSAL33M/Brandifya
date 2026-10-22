import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { databaseOptions } from '../lib/database-config.mjs';
const connection = await mysql.createConnection(databaseOptions());
try {
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  // This is a trusted, repository-owned DDL file. Runtime query connections do not allow multi-statements.
  for (const statement of schema.split(';').map(s => s.trim()).filter(Boolean)) await connection.query(statement);
  console.log('MySQL schema ready. Existing data preserved; no demo inventory was published.');
} finally { await connection.end(); }

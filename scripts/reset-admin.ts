import { db, closeDatabase } from '../lib/db.ts';
import { hashPassword } from '../lib/auth-core.ts';
const username=(process.env.ADMIN_USERNAME || '').trim().toLowerCase();
try {
  if(!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) throw Error('Set ADMIN_USERNAME to an existing admin username.');
  const hash=await hashPassword(process.env.ADMIN_PASSWORD || '');
  await db().begin(async sql=>{
    const rows=await sql`SELECT id FROM admin_users WHERE username=${username} FOR UPDATE`;
    if(!rows.length)throw Error('Admin account not found.');
    await sql`UPDATE admin_users SET password_hash=${hash},updated_at=now() WHERE id=${rows[0].id}`;
    await sql`DELETE FROM admin_sessions WHERE admin_id=${rows[0].id}`;
  });
  console.log('Admin password reset. All sessions revoked. Remove temporary password variables.');
} catch(error) { console.error(error instanceof Error ? error.message : 'Reset failed.');process.exitCode=1; }
finally { await closeDatabase(); }

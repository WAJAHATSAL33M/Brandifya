import { randomUUID } from 'node:crypto';
import { db, databaseConfigured } from '../../../../lib/db';
import { adminUser, createAdminSession, clearAdminSession, validSetupCode, normalizeAdminUsername } from '../../../../lib/admin-auth';
import { storeOrigin, checkOrigin } from '../../../../lib/store-origin';
import { prepareAdminAccess, databaseErrorCode, adminDatabaseMessage } from '../../../../lib/admin-bootstrap';
import { databaseOptions } from '../../../../lib/database-config.mjs';
import { rateLimit } from '../../../../lib/rate-limit';
import { hashPassword, verifyPassword } from '../../../../lib/auth-core';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET() {
  try { storeOrigin(); } catch {
    return Response.json({error:'Set STORE_URL in Hostinger to the exact HTTPS address of this store, then restart the app.'},{status:503,headers});
  }
  if(!databaseConfigured())return Response.json({error:'Connect the store database: set DB_NAME, DB_USER and DB_PASSWORD in Hostinger, then restart the app.'},{status:503,headers});
  try { databaseOptions(); } catch {
    return Response.json({error:'Invalid MySQL configuration. Check DATABASE_URL (mysql://), DB_PORT and DB_SSL in Hostinger. DATABASE_URL overrides the separate DB settings.'},{status:503,headers});
  }
  const setupAvailable=Boolean((process.env.ADMIN_SETUP_TOKEN || process.env.ADMIN_API_TOKEN || '').length>=32);
  try {
    await db()`SELECT id FROM admin_users LIMIT 1`;
    await db()`SELECT token_hash FROM admin_sessions LIMIT 1`;
    await db()`SELECT bucket_key FROM auth_limits LIMIT 1`;
    await db()`SELECT lock_key FROM transaction_locks LIMIT 1`;
    const user=await adminUser();
    const rows=await db()`SELECT id FROM admin_users LIMIT 1`;
    return Response.json({user,setupRequired:!rows.length,setupAvailable},{headers});
  } catch(error) {
    if(databaseErrorCode(error)==='ER_NO_SUCH_TABLE') return Response.json({user:null,repairRequired:true,setupRequired:false,setupAvailable},{headers});
    return Response.json({error:adminDatabaseMessage(error)},{status:503,headers});
  }
}
export async function POST(request:Request) {
  try {checkOrigin(request)} catch {return Response.json({error:'Invalid request origin.'},{status:403,headers})}
  try {
    const text=await request.text();if(text.length>5000)return Response.json({error:'Request too large.'},{status:413,headers});
    const body=JSON.parse(text);
    if(body.action==='prepare') {
      // The private deployment secret is checked BEFORE any schema mutation.
      if(!validSetupCode(body.setupCode))return Response.json({error:'Setup code is incorrect or unavailable.'},{status:401,headers});
      await prepareAdminAccess();
      return Response.json({ok:true},{headers});
    }
    if(body.action==='logout'){await clearAdminSession();return Response.json({ok:true},{headers})}
    if(body.action==='password') {
      const user=await adminUser();if(!user)return Response.json({error:'Sign in again.'},{status:401,headers});
      await rateLimit('admin-password:'+user.id,5);
      const nextHash=await hashPassword(body.newPassword);
      await db().begin(async sql=>{
        const rows=await sql`SELECT password_hash FROM admin_users WHERE id=${user.id} AND active=true FOR UPDATE`;
        if(!rows.length||!(await verifyPassword(body.currentPassword,rows[0].password_hash)))throw Error('Current password is incorrect.');
        await sql`UPDATE admin_users SET password_hash=${nextHash},updated_at=now() WHERE id=${user.id}`;
        await sql`DELETE FROM admin_sessions WHERE admin_id=${user.id}`;
      });
      await clearAdminSession();return Response.json({ok:true,signInRequired:true},{headers});
    }
    if(!['login','setup'].includes(body.action))return Response.json({error:'Invalid action.'},{status:400,headers});
    const username=normalizeAdminUsername(body.username);
    await rateLimit('admin-login-global',100);
    await rateLimit('admin-login:'+username,10);
    if(body.action==='setup') {
      await rateLimit('admin-setup',10);
      if(!validSetupCode(body.setupCode))return Response.json({error:'Setup code is incorrect or unavailable.'},{status:401,headers});
      const hash=await hashPassword(body.password),id=randomUUID();
      await db().begin(async sql=>{
        await sql.lock('first-admin-setup');
        const existing=await sql`SELECT id FROM admin_users LIMIT 1`;
        if(existing.length)throw Error('Admin setup is already complete. Sign in with your username and password.');
        await sql`INSERT INTO admin_users (id,username,password_hash,role,active) VALUES (${id},${username},${hash},'owner',true)`;
      });
      await createAdminSession(id,hash);return Response.json({user:{id,username,role:'owner'}},{headers});
    }
    const rows=await db()`SELECT id,username,role,password_hash,active FROM admin_users WHERE username=${username}`;
    const user=rows[0];
    const correct=await verifyPassword(body.password,user?.password_hash || null);
    if(!user||!user.active||!correct)return Response.json({error:'Username or password is incorrect.'},{status:401,headers});
    await createAdminSession(user.id,user.password_hash);
    await db()`UPDATE admin_users SET last_login_at=now() WHERE id=${user.id}`;
    return Response.json({user:{id:user.id,username:user.username,role:user.role}},{headers});
  }catch(error){
    const message=error instanceof Error?error.message:'';
    const publicMessage=/^(Use a (username|password)|Current password is incorrect|Admin setup is already complete|Too many attempts)/.test(message)?message:adminDatabaseMessage(error);
    return Response.json({error:publicMessage},{status:/Too many attempts/.test(message)?429:400,headers});
  }
}

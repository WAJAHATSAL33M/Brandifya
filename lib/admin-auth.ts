import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { newToken, tokenHash } from './auth-core';
import { storeOrigin, checkOrigin } from './store-origin';
export const adminCookie = () => storeOrigin().startsWith('https://') ? '__Host-brande-admin' : 'brande-admin';
export async function adminUser() {
  const token = (await cookies()).get(adminCookie())?.value;
  if (!token || token.length > 128) return null;
  const rows = await db()`SELECT a.id,a.username,a.role FROM admin_sessions s JOIN admin_users a ON a.id=s.admin_id WHERE s.token_hash=${tokenHash(token)} AND s.expires_at>now() AND a.active=true`;
  return rows[0] || null;
}
export async function adminAuthorized(request: Request) {
  try {
    if (!['GET','HEAD','OPTIONS'].includes(request.method)) checkOrigin(request);
    return Boolean(await adminUser());
  } catch { return false; }
}
export function validSetupCode(code: unknown) {
  // The former API token is supported only for creating the FIRST owner account.
  const expected = process.env.ADMIN_SETUP_TOKEN || process.env.ADMIN_API_TOKEN;
  if (!expected || expected.length < 32 || typeof code !== 'string' || code.length > 256) return false;
  const a=Buffer.from(code), b=Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a,b);
}
export function normalizeAdminUsername(value: unknown) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(value.trim())) throw Error('Use a username of 3–64 letters, numbers, dots, underscores or hyphens.');
  return value.trim().toLowerCase();
}
export async function createAdminSession(id: string, expectedHash: string) {
  const token = newToken();
  await db().begin(async sql => {
    const rows=await sql`SELECT password_hash FROM admin_users WHERE id=${id} AND active=true FOR UPDATE`;
    if(!rows.length || rows[0].password_hash !== expectedHash) throw Error('Sign in again. Your credentials changed.');
    await sql`INSERT INTO admin_sessions (token_hash,admin_id,expires_at) VALUES (${tokenHash(token)},${id},DATE_ADD(now(),INTERVAL 8 HOUR))`;
  });
  await db()`DELETE FROM admin_sessions WHERE expires_at<now()`;
  (await cookies()).set(adminCookie(),token,{ httpOnly:true,secure:storeOrigin().startsWith('https://'),sameSite:'strict',path:'/',maxAge:28800 });
}
export async function clearAdminSession() {
  const jar=await cookies(), token=jar.get(adminCookie())?.value;
  if(token) await db()`DELETE FROM admin_sessions WHERE token_hash=${tokenHash(token)}`;
  jar.set(adminCookie(),'',{ httpOnly:true,secure:storeOrigin().startsWith('https://'),sameSite:'strict',path:'/',maxAge:0 });
}

import { db } from "./db";
import { tokenHash } from "./auth-core";
export async function rateLimit(key: string, limit = 10) {
  const bucket = tokenHash(key + ":" + Math.floor(Date.now() / 600000));
  const rows = await db().begin(async sql => {
    await sql`INSERT INTO auth_limits (bucket_key,count,expires_at) VALUES (${bucket},1,DATE_ADD(now(), INTERVAL 11 MINUTE)) ON DUPLICATE KEY UPDATE count=count+1`;
    return sql`SELECT count FROM auth_limits WHERE bucket_key=${bucket} FOR UPDATE`;
  });
  if (Number(rows[0].count) > limit)
    throw Error("Too many attempts. Try again in ten minutes.");
  await db()`DELETE FROM auth_limits WHERE expires_at<now()`;
}

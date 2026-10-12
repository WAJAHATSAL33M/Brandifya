import { cookies } from "next/headers";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { newToken, tokenHash } from "./auth-core";
export function storeOrigin() {
  const value = process.env.STORE_URL;
  if (!value) throw Error("Store URL is not configured.");
  const url = new URL(value);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw Error("Account access requires an HTTPS store URL.");
  return url.origin;
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== storeOrigin())
    throw Error("Invalid request origin.");
}
export function adminAuthorized(request: Request) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || token.length < 32) return false;
  const a = Buffer.from(request.headers.get("authorization") || ""),
    b = Buffer.from("Bearer " + token);
  return a.length === b.length && timingSafeEqual(a, b);
}
const secure = () => storeOrigin().startsWith("https://");
export const sessionCookie = () =>
  secure() ? "__Host-brande-session" : "brande-session";
export async function sessionUser() {
  const token = (await cookies()).get(sessionCookie())?.value;
  if (!token) return null;
  const rows =
    await db()`SELECT c.id,c.name,c.email,c.email_verified,c.phone,c.address,c.city,c.postal_code,c.country,c.password_hash,s.created_at AS session_created_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=${tokenHash(token)} AND s.expires_at>now()`;
  return rows[0] || null;
}
export function publicProfile(u: Record<string, unknown>) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.email_verified,
    phone: u.phone,
    address: u.address,
    city: u.city,
    postalCode: u.postal_code,
    country: u.country,
  };
}
export async function createSession(id: string) {
  const token = newToken();
  await db()`INSERT INTO customer_sessions (token_hash,customer_id,expires_at) VALUES (${tokenHash(token)},${id},now()+interval '14 days')`;
  await db()`DELETE FROM customer_sessions WHERE expires_at<now()`;
  (await cookies()).set(sessionCookie(), token, {
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    path: "/",
    maxAge: 1209600,
  });
}
export async function clearSession() {
  const jar = await cookies(),
    token = jar.get(sessionCookie())?.value;
  if (token)
    await db()`DELETE FROM customer_sessions WHERE token_hash=${tokenHash(token)}`;
  jar.set(sessionCookie(), "", {
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
export async function rateLimit(key: string, limit = 10) {
  const bucket = tokenHash(key + ":" + Math.floor(Date.now() / 600000));
  const rows =
    await db()`INSERT INTO auth_limits (key,count,expires_at) VALUES (${bucket},1,now()+interval '11 minutes') ON CONFLICT(key) DO UPDATE SET count=auth_limits.count+1 RETURNING count`;
  if (Number(rows[0].count) > limit)
    throw Error("Too many attempts. Try again in ten minutes.");
  await db()`DELETE FROM auth_limits WHERE expires_at<now()`;
}
export function emailReady() {
  return !!(
    process.env.RESEND_API_KEY &&
    process.env.AUTH_FROM_EMAIL &&
    process.env.DATABASE_URL &&
    process.env.STORE_URL
  );
}
export async function sendAccountLink(
  id: string,
  email: string,
  purpose: string,
) {
  if (!emailReady()) throw Error("Account email service is not available yet.");
  const token = newToken();
  await db()`INSERT INTO account_tokens (token_hash,customer_id,purpose,email,expires_at) VALUES (${tokenHash(token)},${id},${purpose},${email},now()+interval '30 minutes')`;
  const url =
    storeOrigin() + "/account/verify?token=" + encodeURIComponent(token);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.AUTH_FROM_EMAIL,
      to: [email],
      subject:
        purpose === "reset"
          ? "Reset your Brande password"
          : "Confirm your Brande email",
      text:
        "Open this link to continue: " +
        url +
        "\nThis link expires in 30 minutes. If you did not request it, ignore this email.",
    }),
  });
  if (!r.ok)
    throw Error("The account email could not be sent. Please try again.");
}
export async function oauthCustomer(
  provider: string,
  subject: string,
  name: string,
  email: string,
) {
  return await db().begin(async (sql) => {
    await sql`SELECT pg_advisory_xact_lock(hashtext(${provider + ":" + subject}))`;
    const existing =
      await sql`SELECT customer_id FROM customer_identities WHERE provider=${provider} AND subject=${subject}`;
    if (existing.length) return String(existing[0].customer_id);
    const id = randomUUID();
    await sql`INSERT INTO customers (id,name,email,email_verified) VALUES (${id},${name.slice(0, 120)},${email},true)`;
    await sql`INSERT INTO customer_identities (provider,subject,customer_id) VALUES (${provider},${subject},${id})`;
    return id;
  });
}

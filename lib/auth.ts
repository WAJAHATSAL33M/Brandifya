import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { db, databaseConfigured } from "./db";
import { newToken, tokenHash } from "./auth-core";
import { storeOrigin } from "./store-origin";
export { storeOrigin, checkOrigin } from "./store-origin";
export { adminAuthorized } from "./admin-auth";
export { rateLimit } from "./rate-limit";
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
  await db()`INSERT INTO customer_sessions (token_hash,customer_id,expires_at) VALUES (${tokenHash(token)},${id},DATE_ADD(now(), INTERVAL 14 DAY))`;
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
export function emailReady() {
  return !!(
    process.env.RESEND_API_KEY &&
    process.env.AUTH_FROM_EMAIL &&
    databaseConfigured() &&
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
  await db()`INSERT INTO account_tokens (token_hash,customer_id,purpose,email,expires_at) VALUES (${tokenHash(token)},${id},${purpose},${email},DATE_ADD(now(), INTERVAL 30 MINUTE))`;
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
    await sql.lock("oauth:" + provider + ":" + subject);
    const existing =
      await sql`SELECT customer_id FROM customer_identities WHERE provider=${provider} AND subject=${subject}`;
    if (existing.length) return String(existing[0].customer_id);
    if (!email) throw Error("A verified email is required for a new account.");
    const id = randomUUID();
    await sql`INSERT INTO customers (id,name,email,email_verified) VALUES (${id},${name.slice(0, 120)},${email},true)`;
    await sql`INSERT INTO customer_identities (provider,subject,customer_id) VALUES (${provider},${subject},${id})`;
    return id;
  });
}

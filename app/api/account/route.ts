import { appleConfigured } from "../../../lib/apple-auth";
import { randomUUID } from "node:crypto";
import { db, databaseConfigured } from "../../../lib/db";
import {
  checkOrigin,
  sessionUser,
  publicProfile,
  createSession,
  clearSession,
  rateLimit,
  sendAccountLink,
  emailReady,
} from "../../../lib/auth";
import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  tokenHash,
  validPassword,
} from "../../../lib/auth-core";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (token) {
      if (token.length > 100) throw Error("Invalid link.");
      const rows =
        await db()`SELECT purpose FROM account_tokens WHERE token_hash=${tokenHash(token)} AND expires_at>now()`;
      return rows.length
        ? Response.json(
            { purpose: rows[0].purpose },
            { headers: { "Cache-Control": "no-store" } },
          )
        : Response.json(
            { error: "This link has expired or has already been used." },
            { status: 400 },
          );
    }
    // Detect missing customer tables before presenting an apparently working form.
    if (!databaseConfigured()) throw Error("Accounts unavailable");
    await Promise.all([
      db()`SELECT id FROM customers LIMIT 1`,
      db()`SELECT token_hash FROM customer_sessions LIMIT 1`,
      db()`SELECT bucket_key FROM auth_limits LIMIT 1`,
      db()`SELECT token_hash FROM account_tokens LIMIT 1`,
    ]);
    const u = await sessionUser();
    return Response.json(
      {
        user: u ? publicProfile(u) : null,
        providers: {
          apple: appleConfigured() && databaseConfigured(),
          email: emailReady(),
          google: !!(
            process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            databaseConfigured() &&
            process.env.STORE_URL
          ),
          facebook: !!(
            process.env.FACEBOOK_CLIENT_ID &&
            process.env.FACEBOOK_CLIENT_SECRET &&
            process.env.FACEBOOK_GRAPH_VERSION &&
            databaseConfigured() &&
            process.env.STORE_URL
          ),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Accounts are not available yet." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const text = await request.text();
    if (text.length > 6000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const b = JSON.parse(text);
    if (b.action === "logout") {
      await clearSession();
      return Response.json({ ok: true });
    }
    if (b.action === "verify") {
      if (typeof b.token !== "string" || b.token.length > 100)
        throw Error("Invalid link.");
      await rateLimit("token:" + tokenHash(b.token));
      await db().begin(async (sql) => {
        const rows =
          await sql`SELECT * FROM account_tokens WHERE token_hash=${tokenHash(b.token)} AND expires_at>now() FOR UPDATE`;
        const t = rows[0];
        if (!t) throw Error("This link has expired or already been used.");
        if (t.purpose === "reset") {
          validPassword(b.password);
          const hash = await hashPassword(b.password);
          await sql`UPDATE customers SET password_hash=${hash},email_verified=true,updated_at=now() WHERE id=${t.customer_id}`;
          await sql`DELETE FROM customer_sessions WHERE customer_id=${t.customer_id}`;
        } else if (t.purpose === "email-change") {
          await sql`UPDATE customers SET email=${t.email},email_verified=true,updated_at=now() WHERE id=${t.customer_id}`;
          await sql`DELETE FROM customer_sessions WHERE customer_id=${t.customer_id}`;
        } else
          await sql`UPDATE customers SET email_verified=true,updated_at=now() WHERE id=${t.customer_id}`;
        await sql`DELETE FROM account_tokens WHERE customer_id=${t.customer_id}`;
      });
      return Response.json({
        ok: true,
        message: "Confirmed. You can now sign in.",
      });
    }
    const email = normalizeEmail(b.email);
    await rateLimit("account:" + email);
    if (b.action === "signup") {
      if (!emailReady()) throw Error("Email sign-up is not configured yet.");
      if (typeof b.name !== "string" || !b.name.trim() || b.name.length > 120)
        throw Error("Enter your full name.");
      const hash = await hashPassword(b.password);
      const id = randomUUID();
      await db()`INSERT INTO customers (id,name,email,password_hash) VALUES (${id},${b.name.trim()},${email},${hash}) ON DUPLICATE KEY UPDATE id=id`;
      const created =
        await db()`SELECT id,password_hash,email_verified FROM customers WHERE email=${email}`;
      const account = created[0];
      // Allow a genuine retry after a delivery failure without replacing credentials.
      if (
        account?.id === id ||
        (account &&
          !account.email_verified &&
          (await verifyPassword(b.password, account.password_hash)))
      )
        await sendAccountLink(String(account.id), email, "verify");
      return Response.json({
        ok: true,
        message:
          "If this address can be registered, a confirmation link has been sent. Check your inbox. If you already have a verified account, sign in instead.",
      });
    }
    const rows = await db()`SELECT * FROM customers WHERE email=${email}`;
    const u = rows[0];
    if (b.action === "resend") {
      if (!emailReady())
        throw Error("Email confirmation is not configured yet.");
      if (u && !u.email_verified)
        await sendAccountLink(String(u.id), email, "verify");
      return Response.json({
        ok: true,
        message:
          "If an unconfirmed account exists, a confirmation link has been sent.",
      });
    }
    if (b.action === "reset") {
      if (!emailReady())
        throw Error("Password recovery is not configured yet.");
      if (u?.password_hash && u.email_verified)
        await sendAccountLink(String(u.id), email, "reset");
      return Response.json({
        ok: true,
        message: "If an eligible account exists, a reset link has been sent.",
      });
    }
    if (b.action !== "login") throw Error("Invalid account action.");
    const correct = await verifyPassword(b.password, u?.password_hash || null);
    if (!u || !correct || !u.email_verified)
      return Response.json(
        {
          error:
            "Email or password is incorrect, or the email has not been confirmed.",
        },
        { status: 401 },
      );
    await createSession(String(u.id));
    return Response.json({ user: publicProfile(u) });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error &&
          !/mysql|database|postgres|duplicate|constraint|relation|column/i.test(
            e.message,
          )
            ? e.message
            : "Account request could not be completed.",
      },
      { status: 400 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const u = await sessionUser();
    if (!u)
      return Response.json(
        { error: "Sign in to edit your profile." },
        { status: 401 },
      );
    const text = await request.text();
    if (text.length > 6000) throw Error("Request too large.");
    const b = JSON.parse(text);
    const values: Record<string, string> = {};
    for (const [key, max] of Object.entries({
      name: 120,
      phone: 30,
      address: 300,
      city: 120,
      postalCode: 20,
      country: 2,
    })) {
      if (typeof b[key] !== "string" || b[key].length > max)
        throw Error("Invalid " + key);
      values[key] = b[key].trim();
    }
    if (!values.name) throw Error("Full name is required.");
    if (values.phone && !/^[+\d\s()-]{7,30}$/.test(values.phone))
      throw Error("Enter a valid phone number.");
    if (values.country && !/^[A-Z]{2}$/.test(values.country))
      throw Error("Use a two-letter country code.");
    const email = normalizeEmail(b.email);
    let emailPending = false;
    if (email !== u.email) {
      await rateLimit("email-change:" + u.id);
      if (u.password_hash) {
        if (!(await verifyPassword(b.currentPassword, u.password_hash)))
          throw Error("Enter your current password to change your email.");
      } else if (Date.now() - new Date(u.session_created_at).getTime() > 600000)
        throw Error("Sign in again before changing your email.");
      await sendAccountLink(String(u.id), email, "email-change");
      emailPending = true;
    }
    await db()`UPDATE customers SET name=${values.name},phone=${values.phone},address=${values.address},city=${values.city},postal_code=${values.postalCode},country=${values.country},updated_at=now() WHERE id=${u.id}`;
    const next = await sessionUser();
    return Response.json({
      user: next ? publicProfile(next) : null,
      message: emailPending
        ? "Profile saved. Confirm the new email using the link sent to it."
        : "Profile saved.",
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error &&
          !/mysql|database|postgres|duplicate|constraint/i.test(e.message)
            ? e.message
            : "Profile could not be saved.",
      },
      { status: 400 },
    );
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db, databaseConfigured } from "../../../../../lib/db";
import {
  createSession,
  oauthCustomer,
  rateLimit,
  storeOrigin,
} from "../../../../../lib/auth";
import { newToken, tokenHash } from "../../../../../lib/auth-core";
import {
  appleConfigured,
  appleClientSecret,
  verifyAppleIdentity,
} from "../../../../../lib/apple-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookie = "__Host-brande-apple-oauth";
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
};
function failed(request: Request) {
  return NextResponse.redirect(
    new URL("/account?error=apple", request.url),
    303,
  );
}
export async function GET(request: Request) {
  try {
    if (!databaseConfigured() || !appleConfigured()) return failed(request);
    await rateLimit("oauth:apple", 200);
    const state = newToken(),
      verifier = newToken(),
      origin = storeOrigin();
    await db()`DELETE FROM oauth_states WHERE expires_at<now()`;
    await db()`INSERT INTO oauth_states(state_hash,provider,verifier,expires_at) VALUES(${tokenHash(state)},'apple',${verifier},DATE_ADD(now(),INTERVAL 10 MINUTE))`;
    (await cookies()).set(cookie, state, { ...cookieOptions, maxAge: 600 });
    const url = new URL("https://appleid.apple.com/auth/authorize");
    url.search = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID!,
      redirect_uri: origin + "/api/account/oauth/apple",
      response_type: "code",
      response_mode: "form_post",
      scope: "name email",
      state,
      nonce: tokenHash(verifier),
    }).toString();
    return NextResponse.redirect(url);
  } catch {
    return failed(request);
  }
}
export async function POST(request: Request) {
  try {
    if (!databaseConfigured() || !appleConfigured()) return failed(request);
    if (
      !request.headers
        .get("content-type")
        ?.startsWith("application/x-www-form-urlencoded")
    )
      return failed(request);
    const text = await request.text();
    if (text.length > 16000) return failed(request);
    const body = new URLSearchParams(text),
      state = body.get("state"),
      jar = await cookies();
    if (!state || state.length > 128 || state !== jar.get(cookie)?.value)
      return failed(request);
    jar.set(cookie, "", { ...cookieOptions, maxAge: 0 });
    // Lock and consume the browser-bound state exactly once, including cancelled attempts.
    const rows = await db().begin(async (sql) => {
      const found =
        await sql`SELECT verifier FROM oauth_states WHERE state_hash=${tokenHash(state)} AND provider='apple' AND expires_at>now() FOR UPDATE`;
      if (found.length)
        await sql`DELETE FROM oauth_states WHERE state_hash=${tokenHash(state)}`;
      return found;
    });
    if (!rows.length || body.has("error")) return failed(request);
    const code = body.get("code");
    if (!code || code.length > 4096) return failed(request);
    const origin = storeOrigin();
    const response = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: await appleClientSecret(),
        code,
        grant_type: "authorization_code",
        redirect_uri: origin + "/api/account/oauth/apple",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const token = await response.json();
    if (!response.ok || typeof token.id_token !== "string")
      return failed(request);
    const identity = await verifyAppleIdentity(
      token.id_token,
      process.env.APPLE_CLIENT_ID!,
      tokenHash(rows[0].verifier),
    );
    let name = "Customer";
    // Apple's name is supplied only on initial consent. Email comes ONLY from the signed ID token.
    try {
      const user = JSON.parse(body.get("user") || "{}");
      const parts = [user.name?.firstName, user.name?.lastName].filter(
        (v) => typeof v === "string",
      );
      if (parts.length) name = parts.join(" ").trim().slice(0, 120) || name;
    } catch {}
    const id = await oauthCustomer(
      "apple",
      identity.subject,
      name,
      identity.email,
    );
    await createSession(id);
    return NextResponse.redirect(origin + "/account", 303);
  } catch {
    return failed(request);
  }
}

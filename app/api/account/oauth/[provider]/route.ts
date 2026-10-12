import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import {
  storeOrigin,
  createSession,
  oauthCustomer,
  rateLimit,
} from "../../../../../lib/auth";
import {
  newToken,
  tokenHash,
  normalizeEmail,
} from "../../../../../lib/auth-core";
import { createHmac } from "node:crypto";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  try {
    if (!["google", "facebook"].includes(provider))
      throw Error("Unknown provider.");
    const origin = storeOrigin(),
      client =
        provider === "google"
          ? process.env.GOOGLE_CLIENT_ID
          : process.env.FACEBOOK_CLIENT_ID,
      secret =
        provider === "google"
          ? process.env.GOOGLE_CLIENT_SECRET
          : process.env.FACEBOOK_CLIENT_SECRET;
    if (
      !client ||
      !secret ||
      !process.env.DATABASE_URL ||
      (provider === "facebook" &&
        !/^v\d+\.\d+$/.test(process.env.FACEBOOK_GRAPH_VERSION || ""))
    )
      throw Error("This sign-in provider is not configured.");
    const redirect = origin + "/api/account/oauth/" + provider,
      jar = await cookies(),
      url = new URL(request.url),
      cookie = origin.startsWith("https://")
        ? "__Host-brande-oauth"
        : "brande-oauth";
    if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
      await rateLimit("oauth:" + provider, 200);
      const state = newToken(),
        verifier = newToken();
      await db()`DELETE FROM oauth_states WHERE expires_at<now()`;
      await db()`INSERT INTO oauth_states (state_hash,provider,verifier,expires_at) VALUES (${tokenHash(state)},${provider},${verifier},now()+interval '10 minutes')`;
      jar.set(cookie, state, {
        httpOnly: true,
        secure: origin.startsWith("https://"),
        sameSite: "lax",
        path: "/",
        maxAge: 600,
      });
      const auth = new URL(
        provider === "google"
          ? "https://accounts.google.com/o/oauth2/v2/auth"
          : "https://www.facebook.com/" +
              process.env.FACEBOOK_GRAPH_VERSION +
              "/dialog/oauth",
      );
      auth.searchParams.set("client_id", client);
      auth.searchParams.set("redirect_uri", redirect);
      auth.searchParams.set("response_type", "code");
      auth.searchParams.set("state", state);
      auth.searchParams.set(
        "scope",
        provider === "google" ? "openid email profile" : "email,public_profile",
      );
      if (provider === "google") {
        auth.searchParams.set(
          "code_challenge",
          Buffer.from(tokenHash(verifier), "hex").toString("base64url"),
        );
        auth.searchParams.set("code_challenge_method", "S256");
      }
      return NextResponse.redirect(auth);
    }
    const state = url.searchParams.get("state");
    if (!state || state !== jar.get(cookie)?.value)
      throw Error("Sign-in state mismatch. Try again.");
    jar.set(cookie, "", {
      httpOnly: true,
      secure: origin.startsWith("https://"),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    const rows =
      await db()`DELETE FROM oauth_states WHERE state_hash=${tokenHash(state)} AND provider=${provider} AND expires_at>now() RETURNING verifier`;
    if (!rows.length || url.searchParams.has("error"))
      throw Error("Sign-in was cancelled or expired.");
    const code = url.searchParams.get("code");
    if (!code) throw Error("Missing code.");
    const body = new URLSearchParams({
      client_id: client,
      client_secret: secret,
      redirect_uri: redirect,
      code,
      grant_type: "authorization_code",
    });
    if (provider === "google") body.set("code_verifier", rows[0].verifier);
    const base =
      "https://graph.facebook.com/" + process.env.FACEBOOK_GRAPH_VERSION;
    const response = await fetch(
      provider === "google"
        ? "https://oauth2.googleapis.com/token"
        : base + "/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const token = await response.json();
    if (!response.ok || !token.access_token)
      throw Error("Provider authorization failed.");
    let subject = "",
      name = "",
      email = "";
    if (provider === "google") {
      const r = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
          headers: { Authorization: "Bearer " + token.access_token },
          cache: "no-store",
        },
      );
      const p = await r.json();
      if (!r.ok || !p.sub || p.email_verified !== true)
        throw Error("A verified Google email is required.");
      subject = p.sub;
      name = p.name || "Customer";
      email = normalizeEmail(p.email);
    } else {
      const check = new URL(base + "/debug_token");
      check.searchParams.set("input_token", token.access_token);
      const r = await fetch(check, {
        headers: { Authorization: "Bearer " + client + "|" + secret },
        cache: "no-store",
      });
      const checked = await r.json();
      if (
        !r.ok ||
        !checked.data?.is_valid ||
        String(checked.data.app_id) !== client ||
        !checked.data.user_id ||
        (checked.data.expires_at &&
          checked.data.expires_at * 1000 <= Date.now())
      )
        throw Error("Facebook token validation failed.");
      const info = new URL(base + "/me");
      info.searchParams.set("fields", "id,name,email");
      info.searchParams.set(
        "appsecret_proof",
        createHmac("sha256", secret).update(token.access_token).digest("hex"),
      );
      const user = await fetch(info, {
        headers: { Authorization: "Bearer " + token.access_token },
        cache: "no-store",
      });
      const p = await user.json();
      if (!user.ok || String(p.id) !== String(checked.data.user_id) || !p.email)
        throw Error("Facebook email permission is required.");
      subject = String(p.id);
      name = p.name || "Customer";
      email = normalizeEmail(p.email);
    }
    const id = await oauthCustomer(provider, subject, name, email);
    await createSession(id);
    return NextResponse.redirect(origin + "/account");
  } catch {
    return NextResponse.redirect(
      new URL("/account?error=provider", request.url),
    );
  }
}

import {
  createRemoteJWKSet,
  importPKCS8,
  jwtVerify,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";
import { normalizeEmail } from "./auth-core.ts";
const issuer = "https://appleid.apple.com";
const appleKeys = createRemoteJWKSet(new URL(issuer + "/auth/keys"), {
  timeoutDuration: 10000,
});
export function appleConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  try {
    const url = new URL(env.STORE_URL || "");
    return Boolean(
      env.APPLE_CLIENT_ID &&
        env.APPLE_TEAM_ID &&
        env.APPLE_KEY_ID &&
        env.APPLE_PRIVATE_KEY &&
        url.protocol === "https:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname),
    );
  } catch {
    return false;
  }
}
export async function appleClientSecret(
  env: Record<string, string | undefined> = process.env,
) {
  if (!appleConfigured(env)) throw Error("Apple sign-in is not configured.");
  const key = await importPKCS8(
    env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    "ES256",
  );
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID! })
    .setIssuer(env.APPLE_TEAM_ID!)
    .setSubject(env.APPLE_CLIENT_ID!)
    .setAudience(issuer)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}
export async function verifyAppleIdentity(
  token: string,
  client: string,
  nonce: string,
  keys: JWTVerifyGetKey = appleKeys,
) {
  const { payload } = await jwtVerify(token, keys, {
    issuer,
    audience: client,
    algorithms: ["RS256"],
    requiredClaims: ["sub", "iat", "exp", "nonce"],
  });
  if (
    payload.nonce !== nonce ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.sub.length > 191
  )
    throw Error("Invalid Apple identity.");
  const email = payload.email;
  if (
    email !== undefined &&
    payload.email_verified !== true &&
    payload.email_verified !== "true"
  )
    throw Error("A verified Apple email is required.");
  return {
    subject: payload.sub,
    email: email === undefined ? "" : normalizeEmail(email),
  };
}

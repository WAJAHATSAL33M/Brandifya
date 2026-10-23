import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeyPair,
  exportJWK,
  exportPKCS8,
  createLocalJWKSet,
  SignJWT,
  jwtVerify,
} from "jose";
import {
  appleConfigured,
  appleClientSecret,
  verifyAppleIdentity,
} from "../lib/apple-auth.ts";
const client = "com.example.store",
  nonce = "test-browser-nonce";
const rsa = await generateKeyPair("RS256");
const publicKey = {
  ...(await exportJWK(rsa.publicKey)),
  kid: "test-apple-key",
  alg: "RS256",
  use: "sig",
};
const keys = createLocalJWKSet({ keys: [publicKey] });
async function identity(overrides: Record<string, unknown> = {}) {
  return new SignJWT({
    nonce,
    email: "customer@privaterelay.appleid.com",
    email_verified: "true",
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-apple-key" })
    .setIssuer("https://appleid.apple.com")
    .setAudience(client)
    .setSubject("apple-stable-subject")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(rsa.privateKey);
}
test("Apple identity accepts a signed, browser-bound verified relay address", async () => {
  const result = await verifyAppleIdentity(
    await identity(),
    client,
    nonce,
    keys,
  );
  assert.equal(result.subject, "apple-stable-subject");
  assert.equal(result.email, "customer@privaterelay.appleid.com");
});
test("Apple rejects wrong nonce, audience, issuer, expiry and unsigned tokens", async () => {
  await assert.rejects(
    verifyAppleIdentity(await identity(), client, "wrong-nonce", keys),
  );
  await assert.rejects(
    verifyAppleIdentity(await identity(), "another-client", nonce, keys),
  );
  const wrongIssuer = await new SignJWT({ nonce })
    .setProtectedHeader({ alg: "RS256", kid: "test-apple-key" })
    .setIssuer("https://attacker.example")
    .setAudience(client)
    .setSubject("subject")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(rsa.privateKey);
  await assert.rejects(verifyAppleIdentity(wrongIssuer, client, nonce, keys));
  const expired = await new SignJWT({ nonce })
    .setProtectedHeader({ alg: "RS256", kid: "test-apple-key" })
    .setIssuer("https://appleid.apple.com")
    .setAudience(client)
    .setSubject("subject")
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
    .sign(rsa.privateKey);
  await assert.rejects(verifyAppleIdentity(expired, client, nonce, keys));
  await assert.rejects(
    verifyAppleIdentity(
      "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhdHRhY2tlciJ9.",
      client,
      nonce,
      keys,
    ),
  );
  await assert.rejects(
    verifyAppleIdentity(
      await identity({ email_verified: false }),
      client,
      nonce,
      keys,
    ),
  );
  await assert.rejects(
    verifyAppleIdentity(
      await identity({ email_verified: "false" }),
      client,
      nonce,
      keys,
    ),
  );
});
test("Apple identity permits missing email for returning subjects only (account creation enforces email)", async () => {
  const result = await verifyAppleIdentity(
    await identity({ email: undefined, email_verified: undefined }),
    client,
    nonce,
    keys,
  );
  assert.equal(result.email, "");
});
test("Apple configuration requires credentials and a public HTTPS origin", () => {
  const config = {
    STORE_URL: "https://store.example",
    APPLE_CLIENT_ID: client,
    APPLE_TEAM_ID: "TEAM123456",
    APPLE_KEY_ID: "KEY1234567",
    APPLE_PRIVATE_KEY: "private",
  };
  assert.equal(appleConfigured(config), true);
  assert.equal(appleConfigured({ ...config, APPLE_PRIVATE_KEY: "" }), false);
  assert.equal(
    appleConfigured({ ...config, STORE_URL: "http://store.example" }),
    false,
  );
  assert.equal(
    appleConfigured({ ...config, STORE_URL: "https://localhost" }),
    false,
  );
});
test("Apple client secrets use ES256, the correct team/services IDs and short expiry", async () => {
  const ec = await generateKeyPair("ES256", { extractable: true }),
    pem = await exportPKCS8(ec.privateKey);
  const token = await appleClientSecret({
    STORE_URL: "https://store.example",
    APPLE_CLIENT_ID: client,
    APPLE_TEAM_ID: "TEAM123456",
    APPLE_KEY_ID: "KEY1234567",
    APPLE_PRIVATE_KEY: pem.replace(/\n/g, "\\n"),
  });
  const verified = await jwtVerify(token, ec.publicKey, {
    issuer: "TEAM123456",
    audience: "https://appleid.apple.com",
    subject: client,
    algorithms: ["ES256"],
  });
  assert.equal(verified.protectedHeader.kid, "KEY1234567");
  assert.ok(verified.payload.exp! - verified.payload.iat! <= 300);
});

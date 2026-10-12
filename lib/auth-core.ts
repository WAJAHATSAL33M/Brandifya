import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (e, key) =>
      e ? reject(e) : resolve(key),
    ),
  );
export function normalizeEmail(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^\S+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    throw Error("Enter a valid email address.");
  return value.trim().toLowerCase();
}
export function validPassword(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    throw Error("Use a password of 12–128 characters.");
}
export async function hashPassword(password: string) {
  validPassword(password);
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + (await derive(password, salt)).toString("hex");
}
export async function verifyPassword(password: unknown, hash: string | null) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [salt, expected] = (
    hash || "00000000000000000000000000000000:" + "0".repeat(128)
  ).split(":");
  const actual = await derive(password, salt);
  const target = Buffer.from(expected || "", "hex");
  return (
    !!hash && actual.length === target.length && timingSafeEqual(actual, target)
  );
}
export function safeMediaUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return false;
  if (/^\/(?!\/)[a-zA-Z0-9/_.,%-]+$/.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}

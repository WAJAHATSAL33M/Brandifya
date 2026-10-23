export function storeOrigin() {
  const value = process.env.STORE_URL;
  if (!value) throw Error("Store URL is not configured.");
  const url = new URL(value);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw Error("Account access requires an HTTPS store URL.");
  return url.origin;
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== storeOrigin()) throw Error("Invalid request origin.");
}

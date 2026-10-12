const fs = require("node:fs");
const original = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  const url = String(input?.url || input);
  if (url === "https://api.resend.com/emails") {
    const data = JSON.parse(init.body);
    fs.writeFileSync(process.env.QA_EMAIL_LOG, JSON.stringify(data));
    return new Response(JSON.stringify({ id: "mock" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url === "https://oauth2.googleapis.com/token")
    return new Response(JSON.stringify({ access_token: "qa-token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if (url === "https://openidconnect.googleapis.com/v1/userinfo")
    return new Response(
      JSON.stringify({
        sub: "qa-google-identity",
        name: "Google Customer",
        email: "google@example.test",
        email_verified: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  if (url.includes("graph.facebook.com/v99.0/oauth/access_token"))
    return new Response(JSON.stringify({ access_token: "qa-facebook" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  if (url.includes("graph.facebook.com/v99.0/debug_token"))
    return new Response(
      JSON.stringify({
        data: {
          is_valid: true,
          app_id: "qa-facebook-client",
          user_id: "qa-facebook-user",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  if (url.includes("graph.facebook.com/v99.0/me"))
    return new Response(
      JSON.stringify({
        id: "qa-facebook-user",
        name: "Facebook Customer",
        email: "facebook@example.test",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  return original(input, init);
};

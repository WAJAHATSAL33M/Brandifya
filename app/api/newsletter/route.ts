import { db, databaseConfigured } from "../../../lib/db";
export async function POST(request: Request) {
  if (!databaseConfigured())
    return Response.json(
      {
        error:
          "Newsletter signup is temporarily unavailable. Please try again later.",
      },
      { status: 503 },
    );
  const origin = process.env.STORE_URL;
  if (!origin || request.headers.get("origin") !== new URL(origin).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const body = await request.json();
    if (
      body.consent !== true ||
      typeof body.email !== "string" ||
      body.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    )
      return Response.json(
        { error: "Enter a valid email and confirm consent." },
        { status: 400 },
      );
    await db()`INSERT INTO newsletter (email) VALUES (${body.email.trim().toLowerCase()}) ON DUPLICATE KEY UPDATE email=email`;
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Signup is temporarily unavailable." },
      { status: 503 },
    );
  }
}

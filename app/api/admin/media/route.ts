import { randomUUID } from "node:crypto";
import { db } from "../../../../lib/db";
import { adminAuthorized } from "../../../../lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const max = 20 * 1024 * 1024;
    if (!request.body) throw Error("Choose a file.");
    const reader = request.body.getReader(),
      chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max + 65536) {
        await reader.cancel();
        throw Error("Upload exceeds 20 MB.");
      }
      chunks.push(value);
    }
    const data = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") || "" },
      body: Buffer.concat(chunks),
    }).formData();
    const file = data.get("file");
    if (!(file instanceof File) || !file.size || file.size > max)
      throw Error("Choose a file up to 20 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid =
      (file.type === "image/png" &&
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.type === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255) ||
      (file.type === "image/webp" &&
        bytes.toString("ascii", 0, 4) === "RIFF" &&
        bytes.toString("ascii", 8, 12) === "WEBP") ||
      (file.type === "video/mp4" && bytes.toString("ascii", 4, 8) === "ftyp");
    if (!valid) throw Error("Use a PNG, JPEG, WebP image or MP4 video.");
    const id = randomUUID();
    await db()`INSERT INTO product_media (id,mime_type,content) VALUES (${id},${file.type},${bytes})`;
    return Response.json({
      url: "/api/media/" + id,
      type: file.type.startsWith("video/") ? "video" : "image",
    });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error &&
          !/mysql|database|postgres|relation/i.test(e.message)
            ? e.message
            : "Upload failed.",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const offset = Math.min(
      1000000,
      Math.max(
        0,
        Math.floor(
          Number(new URL(request.url).searchParams.get("offset")) || 0,
        ),
      ),
    );
    const media =
      await db()`SELECT id,mime_type,created_at,OCTET_LENGTH(content) AS size FROM product_media ORDER BY created_at DESC LIMIT 48 OFFSET ${offset}`;
    return Response.json(
      { media: media.map((m) => ({ ...m, url: "/api/media/" + m.id })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Media library unavailable." },
      { status: 503 },
    );
  }
}

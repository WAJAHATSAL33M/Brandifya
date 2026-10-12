import { db } from "../../../../lib/db";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  try {
    const rows =
      await db()`SELECT mime_type,content FROM product_media WHERE id=${id}`;
    const file = rows[0];
    if (!file) return new Response(null, { status: 404 });
    const bytes: Buffer = file.content;
    const headers: Record<string, string> = {
      "Content-Type": file.mime_type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public,max-age=31536000,immutable",
      "Accept-Ranges": "bytes",
    };
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": "bytes */" + bytes.length },
        });
      const start = Number(match[1]),
        end = match[2]
          ? Math.min(Number(match[2]), bytes.length - 1)
          : bytes.length - 1;
      if (start > end || start >= bytes.length)
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": "bytes */" + bytes.length },
        });
      headers["Content-Range"] =
        "bytes " + start + "-" + end + "/" + bytes.length;
      headers["Content-Length"] = String(end - start + 1);
      return new Response(new Uint8Array(bytes.subarray(start, end + 1)), {
        status: 206,
        headers,
      });
    }
    headers["Content-Length"] = String(bytes.length);
    return new Response(new Uint8Array(bytes), { headers });
  } catch {
    return new Response(null, { status: 503 });
  }
}

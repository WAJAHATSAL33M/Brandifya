import { adminAuthorized } from "../../../../lib/admin-auth";
import { rateLimit } from "../../../../lib/rate-limit";
import { db } from "../../../../lib/db";
import { sendOrderNotifications } from "../../../../lib/order-notifications";
export async function POST(request: Request) {
  if (!(await adminAuthorized(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await rateLimit("order-email-retry", 5);
    // Only failed jobs are reset. Sent messages are never re-enqueued.
    await db()`UPDATE order_notifications SET available_at=now(3),attempts=0 WHERE sent_at IS NULL AND attempts>0`;
    return Response.json(await sendOrderNotifications(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Could not process order emails. Check database and email settings.",
      },
      { status: 503 },
    );
  }
}

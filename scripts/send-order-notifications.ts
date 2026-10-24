import { sendOrderNotifications } from "../lib/order-notifications.ts";
import { closeDatabase } from "../lib/db.ts";
try {
  let sent = 0,
    failed = 0;
  for (let i = 0; i < 10; i++) {
    const result = await sendOrderNotifications();
    if (!result.configured)
      throw Error(
        "Configure RESEND_API_KEY and AUTH_FROM_EMAIL before sending order updates.",
      );
    sent += result.sent;
    failed += result.failed;
    if (result.sent + result.failed < 5) break;
  }
  console.log(
    `Order emails processed: ${sent} sent, ${failed} deferred for retry.`,
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Order email processing failed.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}

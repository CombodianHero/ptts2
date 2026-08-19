/**
 * POST /api/webhook
 *
 * PLACEHOLDER — API INTEGRATION POINT.
 * ------------------------------------------------------------
 * Payment gateways call this endpoint directly (server-to-server)
 * when a payment's status changes. Browser JavaScript cannot
 * receive these events, which is exactly why a real backend is
 * required for production-grade "automatic" payment confirmation.
 *
 * A real implementation must:
 *  1. Verify the webhook signature using a secret stored in an
 *     environment variable (e.g. process.env.WEBHOOK_SECRET) —
 *     NEVER accept an unverified webhook as truth.
 *  2. Look up the booking referenced in the payload.
 *  3. Update payment/booking status in your real database.
 *  4. Return HTTP 200 quickly so the gateway does not retry.
 *
 * This stub only logs the payload and returns 200. It performs
 * NO verification and updates no data.
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // TODO (production): verify signature header against process.env.WEBHOOK_SECRET
  // before trusting req.body in any way.

  console.log("Received webhook payload (placeholder, not verified):", req.body);

  res.status(200).json({ received: true, demo: true });
};

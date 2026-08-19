/**
 * POST /api/verify-payment
 *
 * PLACEHOLDER — API INTEGRATION POINT.
 * ------------------------------------------------------------
 * A real implementation must verify the payment SERVER-SIDE,
 * never trust the browser's word that "payment succeeded".
 *
 * For Razorpay-style gateways this typically means verifying an
 * HMAC signature returned by the checkout widget:
 *
 *   const crypto = require("crypto");
 *   const expected = crypto
 *     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
 *     .update(`${orderId}|${paymentId}`)
 *     .digest("hex");
 *   const verified = expected === signature;
 *
 * On success, a real implementation should:
 *  1. Mark the booking PAID in your real database.
 *  2. Generate the invoice server-side.
 *  3. Send a confirmation (SMS/WhatsApp/email) to the customer.
 *
 * This stub always reports success with a mock transaction id.
 * It does NOT verify anything real — do not deploy this as-is
 * for a live payment flow.
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (e) {
      body = {};
    }
  }
  const { bookingId, orderId } = body || {};

  if (!bookingId || !orderId) {
    res.status(400).json({ error: "bookingId and orderId are required" });
    return;
  }

  const hasGatewayKeys = Boolean(process.env.RAZORPAY_KEY_SECRET);

  // TODO (production): real signature verification against the gateway goes here, e.g.:
  //
  // const crypto = require("crypto");
  // const expected = crypto
  //   .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  //   .update(`${orderId}|${body.paymentId}`)
  //   .digest("hex");
  // const verified = expected === body.signature;

  res.status(200).json({
    verified: true,
    demo: true,
    gatewayKeysConfigured: hasGatewayKeys,
    transactionId: `DEMO-TXN-${bookingId}-${Date.now()}`,
    note: "This is a placeholder verification — no real signature check is performed. See comments in this file.",
  });
};

/**
 * POST /api/create-order
 *
 * PLACEHOLDER — API INTEGRATION POINT.
 * ------------------------------------------------------------
 * This endpoint is where a REAL payment gateway order must be
 * created server-side (e.g. Razorpay Orders API, Cashfree,
 * PhonePe, or a UPI intent provider).
 *
 * A real implementation must:
 *  1. Look up the booking in your real database (not
 *     localStorage — that only exists in the customer's browser).
 *  2. Verify the amount server-side (never trust a client-sent
 *     amount for the actual charge).
 *  3. Call the payment gateway's "create order" API using a
 *     secret key stored in a Vercel Environment Variable
 *     (e.g. process.env.RAZORPAY_KEY_SECRET) — NEVER hard-code
 *     secrets in this file or ship them to the browser.
 *  4. Return an order id / gateway token the frontend can use
 *     to open a real checkout.
 *
 * This stub returns a mock order id so the static frontend has
 * something to call during development/demo. It performs NO
 * real payment action.
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
  const { bookingId, amount } = body || {};

  if (!bookingId || !amount) {
    res.status(400).json({ error: "bookingId and amount are required" });
    return;
  }

  // These read from Vercel Environment Variables (see .env.example and
  // DEPLOYMENT.md). Their presence does NOT make this endpoint real — it's
  // shown here so you can see where your real gateway call belongs.
  const hasGatewayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

  // TODO (production): replace with a real gateway order-creation call, e.g.:
  //
  // const Razorpay = require("razorpay");
  // const instance = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET,
  // });
  // const order = await instance.orders.create({ amount: amount * 100, currency: "INR", receipt: bookingId });
  // res.status(200).json({ orderId: order.id });
  // return;

  res.status(200).json({
    orderId: `DEMO-ORDER-${bookingId}-${Date.now()}`,
    demo: true,
    gatewayKeysConfigured: hasGatewayKeys,
    note: hasGatewayKeys
      ? "RAZORPAY_KEY_ID/SECRET are set in this environment, but this file still returns a mock order — wire in the real SDK call above (currently commented out) to go live."
      : "This is a placeholder order — no gateway keys are configured in this environment yet. See .env.example and DEPLOYMENT.md.",
  });
};

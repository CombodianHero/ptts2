/**
 * POST /api/send-email
 * ------------------------------------------------------------
 * REAL email sending via Resend — this is not a placeholder.
 * The browser never sees RESEND_API_KEY; it only ever calls this
 * endpoint with a template `type` and plain booking data, and
 * this server-side function does the actual Resend API call.
 *
 * Body: { type: string, to: string, data: {...template-specific} }
 * Response: { success: true, id } | { success: false, error }
 *
 * NOTE ON DATA: this project's booking data currently lives in the
 * customer's browser (localStorage) rather than a server database
 * (see README.md for the roadmap to a real DB). Because of that,
 * this endpoint is intentionally "dumb" — it trusts the calling
 * page to pass the booking fields it already has, and only uses
 * its secret key to do the one thing the browser must never do
 * directly: authenticate to Resend. It does NOT trust the browser
 * for anything security-sensitive (the payment amount itself is
 * never decided here — see api/payments/* once a real DB is added).
 */
const { sendEmail } = require("./_lib/resend");
const { TEMPLATES } = require("./_lib/emailTemplates");

const BUSINESS_FALLBACK = {
  name: "Prakash Tour & Travels",
  address: "Near Sasaram Railway Station, Sasaram, Bihar",
  phone: "8409150824",
  whatsapp: "918409150824",
  email: "info@prakashtourtravels.in",
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
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

  const { type, to, data } = body || {};

  if (!type || !TEMPLATES[type]) {
    res.status(400).json({
      success: false,
      error: `Unknown email type "${type}". Valid types: ${Object.keys(TEMPLATES).join(", ")}`,
    });
    return;
  }
  if (!to) {
    res.status(400).json({ success: false, error: "Missing recipient email (to)." });
    return;
  }
  if (!data || !data.booking || !data.booking.bookingId) {
    res.status(400).json({ success: false, error: "Missing data.booking (must include at least bookingId)." });
    return;
  }

  const appUrl = (process.env.APP_URL || `https://${req.headers.host}`).replace(/\/$/, "");
  const business = { ...BUSINESS_FALLBACK, ...(data.business || {}) };

  let subject, html;
  try {
    const built = TEMPLATES[type]({ ...data, business, appUrl });
    subject = built.subject;
    html = built.html;
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to build email content: " + err.message });
    return;
  }

  const result = await sendEmail(to, subject, html);

  if (!result.success) {
    // Never fail silently — the caller logs this into the booking's
    // email history either way (see js/mailer-client.js).
    console.error(`[send-email] Failed to send "${type}" to ${to}:`, result.error);
    res.status(502).json({ success: false, error: result.error, subject });
    return;
  }

  res.status(200).json({ success: true, id: result.id, subject });
};

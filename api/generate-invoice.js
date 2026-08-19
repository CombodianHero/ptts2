/**
 * POST /api/generate-invoice
 *
 * PLACEHOLDER — API INTEGRATION POINT.
 * ------------------------------------------------------------
 * The static demo (js/invoice.js) generates and renders the
 * invoice entirely client-side from data in localStorage, purely
 * so the single-page demo works with zero backend.
 *
 * A real implementation must:
 *  1. Only generate an invoice AFTER a verified PAID status is
 *     recorded server-side (never trust a client-only status).
 *  2. Create a sequential invoice number in your real database
 *     (avoid gaps/duplicates from concurrent requests).
 *  3. Optionally render a PDF server-side (e.g. with a headless
 *     browser or a PDF library) and store it in object storage.
 *  4. Return the invoice number / URL to the frontend.
 *
 * This stub returns a mock invoice number only.
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
  const { bookingId } = body || {};

  if (!bookingId) {
    res.status(400).json({ error: "bookingId is required" });
    return;
  }

  // TODO (production): verify PAID status server-side before generating.

  res.status(200).json({
    invoiceNumber: `PTT-INV-DEMO-${Date.now()}`,
    demo: true,
    note: "This is a placeholder — the working demo instead generates invoice numbers client-side (see js/data.js -> nextInvoiceId).",
  });
};

/* ============================================================
   INVOICE — view & print (A4-friendly, matches site theme)
   ============================================================ */
let DB = loadDB();

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("booking");
  const booking = DB.bookings.find((b) => b.bookingId === bookingId);
  renderInvoice(booking);
});

function renderInvoice(b) {
  const root = document.getElementById("invoice-root");
  if (!b) {
    root.innerHTML = `<div class="container" style="max-width:600px;padding:80px 20px;text-align:center;"><h2>Invoice not found</h2><p style="margin-top:10px;">No booking matches this link.</p><a class="btn btn-primary" style="margin-top:16px;" href="index.html">Back to Home</a></div>`;
    return;
  }

  // INVOICE STATUS RULE: never show a paid invoice before payment verification.
  const eligible = ["PAID", "INVOICE_GENERATED", "BOOKING_CONFIRMED"].includes(b.status);
  if (!eligible) {
    root.innerHTML = `<div class="container" style="max-width:600px;padding:80px 20px;text-align:center;">
      <h2>Invoice not available yet</h2>
      <p style="margin-top:10px;">This invoice will be generated automatically once payment is verified. Current status: <span class="status status-${b.status}">${b.status.replaceAll("_"," ")}</span></p>
      <a class="btn btn-primary" style="margin-top:18px;" href="payment.html?booking=${b.bookingId}">Go to Payment Page</a>
    </div>`;
    return;
  }

  if (!b.invoiceId) {
    DB = loadDB();
    const fresh = DB.bookings.find((x) => x.bookingId === b.bookingId);
    fresh.invoiceId = nextInvoiceId(DB);
    if (fresh.status === "PAID") fresh.status = "INVOICE_GENERATED";
    saveDB(DB);
    b.invoiceId = fresh.invoiceId;
    b.status = fresh.status;
  }

  const balance = Math.max(Number(b.totalAmount || 0) - Number(b.amountPaid || 0), 0);

  root.innerHTML = `
    <div class="container no-print" style="padding:110px 0 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <a href="admin.html#bookings/${b.id}" class="btn btn-outline btn-sm">${icon("chevronRight", 14)} Back</a>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-outline btn-sm" onclick="window.print()">${icon("print", 14)} Print / Save PDF</button>
      </div>
    </div>
    <div class="container" style="padding:26px 0 80px;">
      <div class="invoice-sheet" id="invoice-sheet">
        <div class="invoice-head">
          <div>
            <h2>${DB.settings.businessName}</h2>
            <p style="font-size:13px;margin-top:4px;">${DB.settings.address}</p>
            <p style="font-size:13px;">Contact: ${DB.settings.phone}</p>
          </div>
          <div class="meta">
            <p><b>Invoice #:</b> ${b.invoiceId}</p>
            <p><b>Booking #:</b> ${b.bookingId}</p>
            <p><b>Invoice Date:</b> ${fmtDate(new Date().toISOString())}</p>
          </div>
        </div>

        <div class="invoice-grid">
          <div>
            <h4>Customer Details</h4>
            <p style="font-size:13px;">${b.name}</p>
            <p style="font-size:13px;">${b.phone}</p>
            <p style="font-size:13px;">${b.email || "—"}</p>
          </div>
          <div>
            <h4>Travel Details</h4>
            <p style="font-size:13px;">Pickup: ${b.pickup}</p>
            <p style="font-size:13px;">Destination: ${b.destination}</p>
            <p style="font-size:13px;">Travel Date: ${fmtDate(b.travelDate)} ${b.returnDate ? "→ " + fmtDate(b.returnDate) : ""}</p>
            <p style="font-size:13px;">Vehicle: ${b.vehicle || "—"} · Passengers: ${b.passengers || "—"}</p>
            <p style="font-size:13px;">Trip Type: ${b.serviceType || "—"}</p>
          </div>
        </div>

        <h4 style="font-size:12px;text-transform:uppercase;color:var(--text-500);">Fare Details</h4>
        <table class="invoice-table">
          <thead><tr><th>Description</th><th style="text-align:right;">Amount</th></tr></thead>
          <tbody>
            <tr><td>Vehicle / Tour Charges</td><td style="text-align:right;">${fmtCurrency(b.charges?.vehicle || 0)}</td></tr>
            <tr><td>Driver Charges</td><td style="text-align:right;">${fmtCurrency(b.charges?.driver || 0)}</td></tr>
            <tr><td>Toll / Parking / Other Charges</td><td style="text-align:right;">${fmtCurrency(b.charges?.other || 0)}</td></tr>
            <tr class="invoice-total-row"><td>Total Booking Amount</td><td style="text-align:right;">${fmtCurrency(b.totalAmount)}</td></tr>
            <tr><td>Advance / Payment Received</td><td style="text-align:right;">${fmtCurrency(b.amountPaid)}</td></tr>
            <tr><td><b>Balance Payable</b></td><td style="text-align:right;"><b>${fmtCurrency(balance)}</b></td></tr>
          </tbody>
        </table>

        <div class="invoice-grid" style="margin-top:24px;">
          <div>
            <h4>Payment Details</h4>
            <p style="font-size:13px;">Method: ${b.paymentMethod || "—"}</p>
            <p style="font-size:13px;">Transaction ID: ${b.transactionId || "—"}</p>
            <p style="font-size:13px;">Order ID: ${b.orderId || "—"}</p>
            <p style="font-size:13px;">Payment Date: ${b.paymentDate ? fmtDate(b.paymentDate) : "—"}</p>
            <p style="font-size:13px;">UPI ID: ${DB.settings.upiId}</p>
          </div>
          <div>
            <h4>Status</h4>
            <p style="font-size:13px;">Payment Status: <span class="status status-${b.status === "BOOKING_CONFIRMED" ? "PAID" : b.status}">${(b.status === "BOOKING_CONFIRMED" ? "PAID" : b.status).replaceAll("_"," ")}</span></p>
            <p style="font-size:13px;margin-top:8px;">Booking Status: <span class="status status-${b.status}">${b.status.replaceAll("_"," ")}</span></p>
          </div>
        </div>

        <p class="invoice-note">${DB.settings.terms}<br>${DB.settings.cancellationPolicy}</p>

        <div class="invoice-sign"><div>Authorized Signature</div></div>
      </div>
    </div>`;
}

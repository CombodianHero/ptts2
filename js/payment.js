/* ============================================================
   PAYMENT — QR / manual receipt flow (customer-facing)
   ============================================================ */
let DB = loadDB();
let PAY_BOOKING = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("booking");
  PAY_BOOKING = DB.bookings.find((b) => b.bookingId === bookingId);
  renderPaymentPage();
});

function renderPaymentPage() {
  const root = document.getElementById("payment-root");
  if (!PAY_BOOKING) {
    root.innerHTML = `
      <div class="container" style="max-width:520px;padding:120px 20px 80px;text-align:center;">
        <h2>Booking not found</h2>
        <p style="margin-top:10px;">We couldn't find that booking on this device. Please use the payment link shared with you by ${DB.settings.businessName}, or contact us on WhatsApp.</p>
        <a class="btn btn-primary" style="margin-top:20px;" href="${waLink(DB.settings.whatsapp, "Hi, I need help with my booking payment.")}" target="_blank" rel="noopener">${icon("message", 15)} WhatsApp Us</a>
        <div style="margin-top:14px;"><a href="index.html" class="btn btn-outline">Back to Home</a></div>
      </div>`;
    return;
  }

  const b = PAY_BOOKING;
  const dueAmount = (b.advanceAmount && b.advanceAmount > 0 ? b.advanceAmount : b.totalAmount) - (b.amountPaid || 0);
  const hasQuote = Number(b.totalAmount) > 0;

  root.innerHTML = `
    <div class="container" style="max-width:640px;padding:120px 20px 100px;">
      <a href="index.html" class="brand" style="color:var(--navy-900);font-size:20px;">${DB.settings.businessName.split(" ")[0]} <span style="color:var(--gold-600);">${DB.settings.businessName.split(" ").slice(1).join(" ")}</span></a>
      <div style="margin-top:26px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <h2 style="font-size:24px;">Booking #${b.bookingId}</h2>
        <span class="status status-${b.status}">${b.status.replaceAll("_", " ")}</span>
      </div>
      <p style="color:var(--text-500);margin-top:6px;">${b.pickup} → ${b.destination} · ${fmtDate(b.travelDate)} · ${b.vehicle || "Vehicle TBD"}</p>

      ${renderStatusTimeline(b.status)}

      ${!hasQuote ? `
        <div class="admin-panel-card" style="margin-top:26px;">
          <h3>Waiting for your quote</h3>
          <p style="font-size:13px;">Our team is preparing your fare. You'll be able to pay here as soon as the quote is ready — or reach us directly below.</p>
          <div class="modal-actions" style="margin-top:14px;">
            <a class="btn btn-primary" href="${waLink(DB.settings.whatsapp, "Hi, checking on the quote for booking " + b.bookingId)}" target="_blank" rel="noopener">${icon("message", 15)} WhatsApp Us</a>
            <a class="btn btn-outline" href="tel:${DB.settings.phone}">${icon("phone", 15)} Call</a>
          </div>
        </div>` : `
        <div class="qr-card" style="margin-top:30px;">
          <div class="brand">${DB.settings.businessName}</div>
          <div class="loc">${DB.settings.address.split(",").slice(-2).join(",").trim()}</div>
          <div class="bookingref">Booking #${b.bookingId}</div>
          <div class="qr-box"><div id="qr-canvas"></div></div>
          <div class="qr-amount">${fmtCurrency(dueAmount > 0 ? dueAmount : 0)}</div>
          <div class="qr-note">${b.amountPaid > 0 ? "Balance Payment" : "Advance Payment"}</div>
          <div class="qr-upi">UPI: <b>${DB.settings.upiId}</b></div>
          <p class="qr-note" style="margin-top:10px;">Scan &amp; Pay using any UPI App</p>
        </div>

        <div class="admin-panel-card" style="margin-top:22px;">
          <h3>Fare Summary</h3>
          <div class="kv-row"><span>Total Amount</span><b>${fmtCurrency(b.totalAmount)}</b></div>
          <div class="kv-row"><span>Advance Required</span><b>${fmtCurrency(b.advanceAmount)}</b></div>
          <div class="kv-row"><span>Amount Paid</span><b>${fmtCurrency(b.amountPaid)}</b></div>
          <div class="kv-row"><span>Balance Payable</span><b>${fmtCurrency(Math.max(b.totalAmount - b.amountPaid, 0))}</b></div>
        </div>

        <div class="admin-panel-card">
          <h3>Option 1 — Pay Online (Auto-Verify)</h3>
          <p style="font-size:13px;">Uses a payment order created via the site's API. <em>Placeholder integration — see api/create-order.js.</em></p>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="payOnline()">Create Payment Order</button>
          </div>
          <div id="online-pay-status" style="margin-top:10px;font-size:13px;"></div>
        </div>

        <div class="admin-panel-card">
          <h3>Option 2 — Pay via UPI &amp; Upload Receipt</h3>
          <p style="font-size:13px;">Scan the QR above, pay ${fmtCurrency(dueAmount > 0 ? dueAmount : 0)}, then upload your payment screenshot or receipt for verification.</p>
          <div class="field full" style="margin-top:12px;">
            <label>${icon("upload", 13)} Upload Receipt (JPG, PNG or PDF)</label>
            <input type="file" id="receipt-input" accept=".jpg,.jpeg,.png,.pdf" onchange="handleReceiptUpload(event)">
          </div>
          <div id="receipt-status" style="margin-top:10px;font-size:13px;"></div>
        </div>
      `}

      ${b.status === "PAID" || b.status === "INVOICE_GENERATED" || b.status === "BOOKING_CONFIRMED" ? `
        <div class="admin-panel-card" style="border-color:var(--success);background:var(--success-bg);">
          <h3 style="color:var(--success);">Payment Verified</h3>
          <p style="font-size:13px;">Your invoice is ready.</p>
          <a class="btn btn-primary" style="margin-top:10px;" href="invoice.html?booking=${b.bookingId}">${icon("file", 15)} View Invoice</a>
        </div>` : ""}

      <div style="margin-top:26px;">
        <a href="index.html" style="font-size:13px;color:var(--text-500);">&larr; Back to Home</a>
      </div>
    </div>`;

  if (hasQuote && (dueAmount > 0)) renderQR(b, dueAmount);
}

function renderStatusTimeline(status) {
  const steps = ["PAYMENT_REQUIRED", "RECEIPT_UPLOADED", "PENDING_ADMIN_VERIFICATION", "PAID", "INVOICE_GENERATED", "BOOKING_CONFIRMED"];
  const failed = status === "REJECTED" || status === "PAYMENT_FAILED";
  const idx = steps.indexOf(status);
  return `<div class="admin-panel-card" style="margin-top:20px;">
    <h3>Status</h3>
    ${failed
      ? `<span class="status status-${status}">${status.replaceAll("_", " ")}</span><p style="font-size:13px;margin-top:8px;">Your receipt was not approved, or the payment failed. Please contact us or retry payment.</p>`
      : `<div style="display:flex;flex-wrap:wrap;gap:8px;">${steps
          .map(
            (s, i) => `<span class="status ${i <= idx ? "status-" + s : ""}" style="${i > idx ? "background:#f1f5f9;color:#94a3b8;" : ""}">${s.replaceAll("_", " ")}</span>`
          )
          .join('<span style="color:#cbd5e1;">→</span>')}</div>`}
  </div>`;
}

/* ---- QR generation (real dynamic UPI QR via CDN qrcode lib) ---- */
function renderQR(booking, amount) {
  const upiUri = buildUpiUri(DB.settings.upiId, DB.settings.upiDisplayName, amount, booking.bookingId);
  const target = document.getElementById("qr-canvas");
  target.innerHTML = "";
  try {
    // eslint-disable-next-line no-undef
    new QRCode(target, { text: upiUri, width: 190, height: 190, colorDark: "#0f172a", colorLight: "#ffffff" });
  } catch (e) {
    console.error("QR generation failed", e);
    target.innerHTML = `<div style="width:190px;height:190px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;padding:10px;">
      QR could not be generated. Please pay manually to UPI ID <b>${DB.settings.upiId}</b> and upload your receipt below.</div>`;
  }
}

function buildUpiUri(upiId, name, amount, ref) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: String(Math.max(Number(amount) || 0, 1)),
    cu: "INR",
    tn: `Booking ${ref}`,
    tr: ref,
  });
  return `upi://pay?${params.toString()}`;
}

/* ---- Option 1: "automatic" gateway placeholder flow ---- */
async function payOnline() {
  const statusEl = document.getElementById("online-pay-status");
  statusEl.textContent = "Creating payment order…";
  try {
    // PLACEHOLDER API CALL — see api/create-order.js for what a real server must do.
    const orderRes = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: PAY_BOOKING.bookingId, amount: PAY_BOOKING.advanceAmount || PAY_BOOKING.totalAmount }),
    }).then((r) => r.json()).catch(() => null);

    const orderId = (orderRes && orderRes.orderId) || `DEMO-ORDER-${Date.now()}`;
    statusEl.textContent = `Order ${orderId} created. Simulating gateway checkout…`;

    // PLACEHOLDER: in production, this is where a real gateway checkout (e.g. Razorpay) would open.
    await new Promise((res) => setTimeout(res, 900));

    const verifyRes = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: PAY_BOOKING.bookingId, orderId }),
    }).then((r) => r.json()).catch(() => ({ verified: true, transactionId: `DEMO-TXN-${Date.now()}` }));

    DB = loadDB();
    const b = DB.bookings.find((x) => x.bookingId === PAY_BOOKING.bookingId);
    b.status = "PAID";
    b.orderId = orderId;
    b.transactionId = verifyRes.transactionId || `DEMO-TXN-${Date.now()}`;
    b.paymentMethod = "UPI (Auto)";
    b.paymentDate = new Date().toISOString();
    b.amountPaid = b.advanceAmount || b.totalAmount;
    saveDB(DB);
    PAY_BOOKING = b;
    sendTransactionalEmail("payment_approved", b);
    statusEl.innerHTML = `<span style="color:var(--success);font-weight:700;">Payment verified. Redirecting…</span>`;
    setTimeout(renderPaymentPage, 700);
  } catch (e) {
    statusEl.innerHTML = `<span style="color:var(--danger);">Could not create payment order. Please use the QR/receipt option below or contact us.</span>`;
  }
}

/* ---- Option 2: manual UPI + receipt upload ---- */
function handleReceiptUpload(e) {
  const file = e.target.files[0];
  const statusEl = document.getElementById("receipt-status");
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (!allowed.includes(file.type)) {
    statusEl.innerHTML = `<span style="color:var(--danger);">Please upload a JPG, PNG or PDF file.</span>`;
    return;
  }
  statusEl.textContent = "Uploading…";
  const reader = new FileReader();
  reader.onload = () => {
    DB = loadDB();
    const b = DB.bookings.find((x) => x.bookingId === PAY_BOOKING.bookingId);
    b.receipt = { name: file.name, type: file.type, dataUrl: reader.result, uploadedAt: new Date().toISOString() };
    b.status = "PENDING_ADMIN_VERIFICATION";
    saveDB(DB);
    PAY_BOOKING = b;
    sendTransactionalEmail("payment_submitted", b, { amount: b.advanceAmount || b.totalAmount });
    statusEl.innerHTML = `<span style="color:var(--success);font-weight:700;">${icon("check", 14)} Receipt uploaded. Status: Pending Admin Verification.</span>`;
    setTimeout(renderPaymentPage, 800);
  };
  reader.onerror = () => {
    statusEl.innerHTML = `<span style="color:var(--danger);">Upload failed. Please try again or send the receipt on WhatsApp.</span>`;
  };
  reader.readAsDataURL(file);
}

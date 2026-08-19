/* ============================================================
   PRAKASH TOUR & TRAVELS — OWNER CONTROL PANEL
   Same theme as the customer site. Auth is a client-side demo
   only — see the login screen note and README for production
   requirements (server-side auth, not this).
   ============================================================ */
let DB = loadDB();
const AUTH_KEY = "ptt_admin_auth_v1";
const DEMO_USER = "admin";
const DEMO_PASS = "ChangeMe123!";
const MANAGER_EDIT_ID = {};

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("hashchange", renderRoute);
  renderApp();
});

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

function renderApp() {
  if (!isAuthed()) {
    renderLogin();
  } else {
    renderShell();
    renderRoute();
  }
}

/* ---------------- LOGIN ---------------- */
function renderLogin() {
  document.getElementById("admin-root").innerHTML = `
    <div class="login-wrap">
      ${withFallbackAdmin(`<img src="${DB.destinations[0].img}" alt="">`)}
      <div class="login-card">
        <div class="brand-mark">${DB.settings.businessName.split(" ")[0]} <span>${DB.settings.businessName.split(" ").slice(1).join(" ")}</span></div>
        <div class="sub">Owner Control Panel</div>
        <form onsubmit="handleLogin(event)" style="display:flex;flex-direction:column;gap:14px;">
          <div class="field"><label>Username</label><input required id="login-user" autocomplete="username"></div>
          <div class="field"><label>Password</label><input required id="login-pass" type="password" autocomplete="current-password"></div>
          <div id="login-error" style="color:var(--danger);font-size:13px;display:none;">Incorrect username or password.</div>
          <button class="btn btn-primary btn-block" type="submit">Log In</button>
        </form>
        <div class="login-hint">Demo credentials — <b>admin / ChangeMe123!</b><br>Replace with secure server-side authentication before going live.</div>
        <div style="text-align:center;margin-top:16px;"><a href="index.html" style="font-size:12px;color:var(--text-500);">&larr; Back to website</a></div>
      </div>
    </div>`;
}
function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("login-user").value.trim();
  const p = document.getElementById("login-pass").value;
  if (u === DEMO_USER && p === DEMO_PASS) {
    sessionStorage.setItem(AUTH_KEY, "true");
    location.hash = "#dashboard";
    renderApp();
  } else {
    document.getElementById("login-error").style.display = "block";
  }
}
function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  renderApp();
}
function withFallbackAdmin(tag) {
  return tag.replace("<img ", `<img onerror="this.onerror=null;this.style.display='none';" `);
}

/* ---------------- SHELL (sidebar + topbar) ---------------- */
const NAV_ITEMS = [
  ["dashboard", "dashboard", "Dashboard"],
  ["bookings", "list", "Bookings"],
  ["customers", "users", "Customers"],
  ["vehicles", "car", "Vehicles"],
  ["destinations", "pin", "Destinations"],
  ["tours", "compass", "Tour Packages"],
  ["services", "briefcase", "Services"],
  ["payments", "wallet", "Payments"],
  ["receipts", "receipt", "Receipt Verification"],
  ["invoices", "file", "Invoices"],
  ["settings", "settings", "Settings"],
];

function renderShell() {
  document.getElementById("admin-root").innerHTML = `
    <div class="admin-body">
      <div class="admin-shell">
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="brand">${DB.settings.businessName.split(" ")[0]} <span style="color:var(--gold-400);">${DB.settings.businessName.split(" ").slice(1).join(" ")}</span>
            <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">Owner Control Panel</div>
          </div>
          <nav id="admin-nav"></nav>
          <div class="foot">
            <button class="link-btn" style="color:var(--gold-400);display:flex;align-items:center;gap:6px;" onclick="logout()">${icon("logout", 14)} Log Out</button>
          </div>
        </aside>
        <div class="admin-main">
          <div class="admin-topbar">
            <div style="display:flex;align-items:center;gap:12px;">
              <button class="admin-menu-btn" onclick="toggleSidebar()">${icon("menu", 22)}</button>
              <h1 id="topbar-title">Dashboard</h1>
            </div>
            <a href="index.html" class="btn btn-outline btn-sm" target="_blank">View Website</a>
          </div>
          <div class="admin-content" id="admin-content"></div>
        </div>
      </div>
    </div>`;
  renderSidebarNav();
}
function toggleSidebar() {
  document.getElementById("admin-sidebar").classList.toggle("open");
}
function renderSidebarNav() {
  const route = currentRouteKey();
  document.getElementById("admin-nav").innerHTML = NAV_ITEMS.map(
    ([key, ic, label]) => `<a href="#${key}" class="${route === key ? "active" : ""}">${icon(ic, 16)} ${label}</a>`
  ).join("");
}

/* ---------------- ROUTER ---------------- */
function currentRouteKey() {
  return (location.hash.slice(1) || "dashboard").split("/")[0];
}
function renderRoute() {
  DB = loadDB();
  const hash = location.hash.slice(1) || "dashboard";
  const [key, arg] = hash.split("/");
  document.getElementById("admin-sidebar")?.classList.remove("open");
  renderSidebarNav();
  const titleMap = Object.fromEntries(NAV_ITEMS.map(([k, , l]) => [k, l]));
  document.getElementById("topbar-title").textContent = key === "bookings" && arg ? "Booking Detail" : (titleMap[key] || "Dashboard");

  switch (key) {
    case "dashboard": return renderDashboard();
    case "bookings": return arg ? renderBookingDetail(arg) : renderBookingsList();
    case "customers": return renderCustomers();
    case "vehicles": return renderVehiclesManager();
    case "destinations": return renderDestinationsManager();
    case "tours": return renderToursManager();
    case "services": return renderServicesManager();
    case "payments": return renderPayments();
    case "receipts": return renderReceipts();
    case "invoices": return renderInvoices();
    case "settings": return renderSettings();
    default: return renderDashboard();
  }
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard() {
  const bk = DB.bookings;
  const stat = (label, value, gold) => `<div class="stat-card ${gold ? "gold" : ""}"><div class="label">${label}</div><div class="value">${value}</div></div>`;
  const revenue = bk.reduce((s, b) => s + Number(b.amountPaid || 0), 0);
  const pendingBalance = bk.reduce((s, b) => s + Math.max(Number(b.totalAmount || 0) - Number(b.amountPaid || 0), 0), 0);

  document.getElementById("admin-content").innerHTML = `
    <div class="stat-grid">
      ${stat("Total Bookings", bk.length)}
      ${stat("New Enquiries", bk.filter((b) => b.status === "PAYMENT_REQUIRED").length)}
      ${stat("Pending Verification", bk.filter((b) => b.status === "PENDING_ADMIN_VERIFICATION").length)}
      ${stat("Paid Bookings", bk.filter((b) => ["PAID", "INVOICE_GENERATED", "BOOKING_CONFIRMED"].includes(b.status)).length)}
      ${stat("Confirmed Bookings", bk.filter((b) => b.status === "BOOKING_CONFIRMED").length)}
      ${stat("Failed Payments", bk.filter((b) => b.status === "PAYMENT_FAILED").length)}
      ${stat("Total Revenue", fmtCurrency(revenue), true)}
      ${stat("Pending Balance", fmtCurrency(pendingBalance))}
    </div>
    <div class="admin-panel-card">
      <h3>Recent Bookings</h3>
      ${bookingsTable(bk.slice(0, 8))}
    </div>`;
}

function bookingsTable(list) {
  if (!list.length) return `<p style="font-size:13px;color:var(--text-500);">No bookings yet.</p>`;
  return `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr><th>Booking ID</th><th>Customer</th><th>Phone</th><th>Route</th><th>Vehicle</th><th>Travel Date</th><th>Amount</th><th>Payment</th><th>Booking</th><th>Actions</th></tr></thead>
    <tbody>
      ${list
        .map(
          (b) => `<tr>
        <td><b>${b.bookingId}</b></td>
        <td>${b.name || "—"}</td>
        <td>${b.phone || "—"}</td>
        <td>${b.pickup} → ${b.destination}</td>
        <td>${b.vehicle || "—"}</td>
        <td>${fmtDate(b.travelDate)}</td>
        <td>${fmtCurrency(b.totalAmount)}</td>
        <td><span class="status status-${b.status === "BOOKING_CONFIRMED" ? "PAID" : b.status}">${(b.status === "BOOKING_CONFIRMED" ? "PAID" : b.status).replaceAll("_", " ")}</span></td>
        <td>${b.cancelled ? `<span class="status status-REJECTED">CANCELLED</span>` : `<span class="status status-${b.status}">${b.status.replaceAll("_", " ")}</span>`}</td>
        <td><a href="#bookings/${b.id}" class="link-btn">View</a></td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table></div>`;
}

/* ---------------- BOOKINGS LIST ---------------- */
function renderBookingsList() {
  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>All Bookings (${DB.bookings.length})</h3>
      ${bookingsTable(DB.bookings)}
    </div>`;
}

/* ---------------- BOOKING DETAIL ---------------- */
function renderBookingDetail(id) {
  const b = DB.bookings.find((x) => x.id === id);
  const root = document.getElementById("admin-content");
  if (!b) {
    root.innerHTML = `<p>Booking not found. <a href="#bookings">Back to bookings</a></p>`;
    return;
  }
  const payUrl = `${location.origin}${location.pathname.replace("admin.html", "")}payment.html?booking=${b.bookingId}`;
  const invUrl = `${location.origin}${location.pathname.replace("admin.html", "")}invoice.html?booking=${b.bookingId}`;

  root.innerHTML = `
    <a href="#bookings" class="link-btn" style="margin-bottom:14px;display:inline-block;">&larr; Back to Bookings</a>
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px;">
      <h2 style="font-size:20px;">${b.bookingId}${b.cancelled ? ` <span class="status status-REJECTED">CANCELLED</span>` : ""}</h2>
      <span class="status status-${b.status}">${b.status.replaceAll("_", " ")}</span>
    </div>

    <div class="admin-panel-card">
      <h3>Customer &amp; Travel Information</h3>
      <div class="kv-row"><span>Name</span><b>${b.name || "—"}</b></div>
      <div class="kv-row"><span>Phone</span><b>${b.phone || "—"}</b></div>
      <div class="kv-row"><span>WhatsApp</span><b>${b.whatsapp || "—"}</b></div>
      <div class="kv-row"><span>Email</span><b>${b.email || "—"}</b></div>
      <div class="kv-row"><span>Pickup → Destination</span><b>${b.pickup} → ${b.destination}</b></div>
      <div class="kv-row"><span>Travel / Return Date</span><b>${fmtDate(b.travelDate)} ${b.returnDate ? "→ " + fmtDate(b.returnDate) : ""}</b></div>
      <div class="kv-row"><span>Vehicle</span><b>${b.vehicle || "—"}</b></div>
      <div class="kv-row"><span>Passengers</span><b>${b.passengers || "—"}</b></div>
      <div class="kv-row"><span>Service / Trip Type</span><b>${b.serviceType || "—"}</b></div>
      <div class="kv-row"><span>Message</span><b>${b.message || "—"}</b></div>
      <div class="kv-row"><span>Created</span><b>${fmtDate(b.createdAt)}</b></div>
    </div>

    <div class="admin-panel-card">
      <h3>Quote &amp; Charges</h3>
      <form onsubmit="saveQuote(event,'${b.id}')" class="form-grid cols-3">
        <div class="field"><label>Vehicle / Tour Charges</label><input type="number" name="vehicle" value="${b.charges?.vehicle || 0}"></div>
        <div class="field"><label>Driver Charges</label><input type="number" name="driver" value="${b.charges?.driver || 0}"></div>
        <div class="field"><label>Toll / Parking / Other</label><input type="number" name="other" value="${b.charges?.other || 0}"></div>
        <div class="field"><label>Total Amount (₹)</label><input type="number" name="totalAmount" value="${b.totalAmount || 0}"></div>
        <div class="field"><label>Advance Required (₹)</label><input type="number" name="advanceAmount" value="${b.advanceAmount || 0}"></div>
        <div class="field"><label>&nbsp;</label><button class="btn btn-primary" type="submit">Save Quote &amp; Generate Payment Request</button></div>
      </form>
      ${b.totalAmount > 0 ? `
        <div class="kv-row" style="margin-top:10px;"><span>Payment Link</span><b><a href="${payUrl}" target="_blank" style="color:var(--gold-600);">${payUrl}</a></b></div>
        <div class="modal-actions">
          <button class="btn btn-primary btn-sm" onclick="sendPaymentLinkEmail('${b.id}')">${icon("mail", 14)} Send Payment Link Email</button>
          <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${payUrl}');toast('Payment link copied.')">${icon("file", 14)} Copy Link</button>
          <a class="btn btn-outline btn-sm" href="${waLink(DB.settings.whatsapp.startsWith('91')?b.whatsapp:b.whatsapp, `Your quote for ${b.bookingId} is ready.\nTotal: ${fmtCurrency(b.totalAmount)}\nAdvance: ${fmtCurrency(b.advanceAmount)}\nPay here: ${payUrl}`)}" target="_blank">${icon("message", 14)} Send on WhatsApp</a>
        </div>
        ${!b.email ? `<p style="font-size:12px;color:var(--danger);margin-top:8px;">No email address on file for this customer — the payment link email can't be sent until one is added.</p>` : ""}` : `<p style="font-size:12px;color:var(--text-500);margin-top:8px;">Set an amount above to generate the customer payment link.</p>`}
    </div>

    <div class="admin-panel-card">
      <h3>Payment Status</h3>
      <div class="kv-row"><span>Amount Paid</span><b>${fmtCurrency(b.amountPaid)}</b></div>
      <div class="kv-row"><span>Balance</span><b>${fmtCurrency(Math.max((b.totalAmount||0) - (b.amountPaid||0), 0))}</b></div>
      <div class="kv-row"><span>Payment Method</span><b>${b.paymentMethod || "—"}</b></div>
      <div class="kv-row"><span>Transaction ID</span><b>${b.transactionId || "—"}</b></div>
      ${b.rejectionReason ? `<div class="kv-row"><span>Last Rejection Reason</span><b>${b.rejectionReason}</b></div>` : ""}
      ${b.cancellationReason ? `<div class="kv-row"><span>Cancellation Reason</span><b>${b.cancellationReason}</b></div>` : ""}

      ${b.receipt ? `
        <h4 style="margin-top:16px;font-size:12px;text-transform:uppercase;color:var(--text-500);">Uploaded Receipt</h4>
        <p style="font-size:13px;">${b.receipt.name} · uploaded ${fmtDate(b.receipt.uploadedAt)}</p>
        <a class="btn btn-outline btn-sm" target="_blank" href="${b.receipt.dataUrl}">${icon("eye", 14)} View Receipt</a>
      ` : `<p style="font-size:12px;color:var(--text-500);margin-top:10px;">No receipt uploaded yet.</p>`}

      <div class="modal-actions">
        ${b.status === "PENDING_ADMIN_VERIFICATION" ? `
          <button class="btn btn-success btn-sm" onclick="approveReceipt('${b.id}')">${icon("check", 14)} Approve Receipt</button>
          <button class="btn btn-danger btn-sm" onclick="rejectReceipt('${b.id}')">${icon("x", 14)} Reject Receipt</button>
        ` : ""}
        ${["PAYMENT_REQUIRED", "PAYMENT_FAILED"].includes(b.status) ? `
          <button class="btn btn-outline btn-sm" onclick="markPaidManually('${b.id}')">Mark Paid Manually</button>
        ` : ""}
        ${b.status === "PAYMENT_FAILED" ? `<button class="btn btn-outline btn-sm" onclick="retryPayment('${b.id}')">Reset to Payment Required</button>` : ""}
      </div>
    </div>

    <div class="admin-panel-card">
      <h3>Invoice &amp; Confirmation</h3>
      <div class="kv-row"><span>Invoice Number</span><b>${b.invoiceId || "Not generated"}</b></div>
      <div class="modal-actions">
        ${b.status === "PAID" ? `<button class="btn btn-primary btn-sm" onclick="generateInvoice('${b.id}')">${icon("file", 14)} Generate Invoice</button>` : ""}
        ${["INVOICE_GENERATED", "BOOKING_CONFIRMED"].includes(b.status) ? `<a class="btn btn-outline btn-sm" href="${invUrl}" target="_blank">${icon("eye", 14)} View Invoice</a>` : ""}
        ${b.status === "INVOICE_GENERATED" ? `<button class="btn btn-success btn-sm" onclick="confirmBooking('${b.id}')">${icon("check", 14)} Confirm Booking</button>` : ""}
        ${!b.cancelled && b.status !== "BOOKING_CONFIRMED" ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id}')">Cancel Booking</button>` : ""}
      </div>
    </div>

    <div class="admin-panel-card">
      <h3>Email History</h3>
      ${renderEmailHistory(b.bookingId)}
    </div>`;
}

function renderEmailHistory(bookingId) {
  const logs = (DB.emailLogs || []).filter((l) => l.bookingId === bookingId);
  if (!logs.length) return `<p style="font-size:13px;color:var(--text-500);">No emails sent for this booking yet.</p>`;
  return `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr><th>Type</th><th>Recipient</th><th>Subject</th><th>Sent</th><th>Status</th><th>Provider ID / Error</th><th>Actions</th></tr></thead>
    <tbody>${logs
      .map(
        (l) => `<tr>
      <td>${l.emailType.replaceAll("_", " ")}</td>
      <td>${l.recipient}</td>
      <td>${l.subject || "—"}</td>
      <td>${fmtDate(l.sentAt)}</td>
      <td><span class="status ${l.status === "SENT" ? "status-PAID" : "status-PAYMENT_FAILED"}">${l.status}</span></td>
      <td style="max-width:220px;white-space:normal;font-size:11px;color:var(--text-500);">${l.providerMessageId || l.errorMessage || "—"}</td>
      <td><button class="link-btn" onclick="resendEmail('${bookingId}','${l.emailType}')">Resend</button></td>
    </tr>`
      )
      .join("")}</tbody>
  </table></div>`;
}

function findBooking(id) {
  DB = loadDB();
  return DB.bookings.find((x) => x.id === id);
}
function persistAndRerender(msg) {
  saveDB(DB);
  toast(msg);
  renderRoute();
}

function saveQuote(e, id) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const b = findBooking(id);
  const isFirstQuote = !b.totalAmount || b.totalAmount === 0;
  b.charges = { vehicle: Number(fd.get("vehicle") || 0), driver: Number(fd.get("driver") || 0), other: Number(fd.get("other") || 0) };
  b.totalAmount = Number(fd.get("totalAmount") || 0);
  b.advanceAmount = Number(fd.get("advanceAmount") || 0);
  b.paymentToken = b.paymentToken || b.bookingId; // see README: real token-based links need a server DB
  saveDB(DB);
  toast("Quote saved.");
  renderRoute();
}

function sendPaymentLinkEmail(id) {
  const b = findBooking(id);
  if (!b.totalAmount) {
    toast("Set an amount before sending the payment link.", "error");
    return;
  }
  sendTransactionalEmail("booking_approved_payment_required", b).then((r) => {
    toast(r.success ? "Payment link email sent." : "Email failed: " + r.error, r.success ? "success" : "error");
    renderRoute();
  });
}

function approveReceipt(id) {
  const b = findBooking(id);
  b.status = "PAID";
  b.paymentMethod = b.paymentMethod || "UPI (Receipt Verified)";
  b.paymentDate = new Date().toISOString();
  b.amountPaid = b.advanceAmount || b.totalAmount;
  b.transactionId = b.transactionId || `RCPT-${b.bookingId}`;
  saveDB(DB);
  sendTransactionalEmail("payment_approved", b).then(renderRoute);
  toast("Receipt approved — booking marked PAID. Sending confirmation email…");
  renderRoute();
}
function rejectReceipt(id) {
  const reason = prompt("Reason for rejecting this payment (shown to the customer):", "The submitted screenshot could not be verified. Please upload a clearer copy.");
  if (reason === null) return;
  const b = findBooking(id);
  b.status = "PAYMENT_FAILED";
  b.rejectionReason = reason;
  saveDB(DB);
  sendTransactionalEmail("payment_rejected", b, { reason }).then(renderRoute);
  toast("Receipt rejected. Sending notification email…");
  renderRoute();
}
function markPaidManually(id) {
  const method = prompt("Payment method (e.g. Cash, UPI, Bank Transfer):", "Cash");
  if (method === null) return;
  const txn = prompt("Transaction / reference ID (optional):", "");
  const b = findBooking(id);
  b.status = "PAID";
  b.paymentMethod = method || "Manual";
  b.transactionId = txn || `MANUAL-${b.bookingId}`;
  b.paymentDate = new Date().toISOString();
  b.amountPaid = b.advanceAmount || b.totalAmount || b.amountPaid;
  saveDB(DB);
  sendTransactionalEmail("payment_approved", b).then(renderRoute);
  toast("Booking marked as paid. Sending confirmation email…");
  renderRoute();
}
function retryPayment(id) {
  const b = findBooking(id);
  b.status = "PAYMENT_REQUIRED";
  persistAndRerender("Booking reset to Payment Required.");
}
function generateInvoice(id) {
  const b = findBooking(id);
  b.invoiceId = b.invoiceId || nextInvoiceId(DB);
  b.status = "INVOICE_GENERATED";
  saveDB(DB);
  sendTransactionalEmail("invoice_ready", b).then(renderRoute);
  toast("Invoice generated. Sending email…");
  renderRoute();
}
function confirmBooking(id) {
  const b = findBooking(id);
  b.status = "BOOKING_CONFIRMED";
  saveDB(DB);
  sendTransactionalEmail("booking_confirmed", b).then(renderRoute);
  toast("Booking confirmed. Sending email…");
  renderRoute();
}
function cancelBooking(id) {
  const reason = prompt("Reason for cancelling (shown to the customer, optional):", "");
  if (reason === null) return;
  const b = findBooking(id);
  b.cancelled = true;
  b.cancellationReason = reason;
  saveDB(DB);
  sendTransactionalEmail("booking_cancelled", b, { reason }).then(renderRoute);
  toast("Booking cancelled. Sending notification email…");
  renderRoute();
}
function resendEmail(bookingId, type) {
  const b = DB.bookings.find((x) => x.bookingId === bookingId);
  sendTransactionalEmail(type, b, { isReminder: true }).then((r) => {
    toast(r.success ? "Email resent." : "Resend failed: " + r.error, r.success ? "success" : "error");
    renderRoute();
  });
}

/* ---------------- CUSTOMERS (derived from bookings) ---------------- */
function renderCustomers() {
  const map = new Map();
  DB.bookings.forEach((b) => {
    const key = b.phone || b.name;
    if (!key) return;
    if (!map.has(key)) map.set(key, { name: b.name, phone: b.phone, email: b.email, count: 0, spend: 0 });
    const c = map.get(key);
    c.count += 1;
    c.spend += Number(b.amountPaid || 0);
  });
  const customers = [...map.values()];
  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>Customers (${customers.length})</h3>
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Bookings</th><th>Total Spend</th></tr></thead>
        <tbody>${customers.length ? customers.map((c) => `<tr><td>${c.name || "—"}</td><td>${c.phone || "—"}</td><td>${c.email || "—"}</td><td>${c.count}</td><td>${fmtCurrency(c.spend)}</td></tr>`).join("") : `<tr><td colspan="5" style="color:var(--text-500);">No customers yet.</td></tr>`}</tbody>
      </table></div>
    </div>`;
}

/* ---------------- PAYMENTS ---------------- */
function renderPayments() {
  const paid = DB.bookings.filter((b) => ["PAID", "INVOICE_GENERATED", "BOOKING_CONFIRMED", "PAYMENT_FAILED"].includes(b.status));
  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>Payments (${paid.length})</h3>
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Booking</th><th>Customer</th><th>Amount Paid</th><th>Method</th><th>Transaction ID</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${paid.length ? paid.map((b) => `<tr><td>${b.bookingId}</td><td>${b.name}</td><td>${fmtCurrency(b.amountPaid)}</td><td>${b.paymentMethod || "—"}</td><td>${b.transactionId || "—"}</td><td>${b.paymentDate ? fmtDate(b.paymentDate) : "—"}</td><td><span class="status status-${b.status}">${b.status.replaceAll("_"," ")}</span></td></tr>`).join("") : `<tr><td colspan="7" style="color:var(--text-500);">No payments yet.</td></tr>`}</tbody>
      </table></div>
    </div>`;
}

/* ---------------- RECEIPT VERIFICATION ---------------- */
function renderReceipts() {
  const list = DB.bookings.filter((b) => b.receipt);
  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>Receipts (${list.length})</h3>
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Booking</th><th>Customer</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${list.length ? list.map((b) => `<tr>
          <td>${b.bookingId}</td><td>${b.name}</td><td>${fmtDate(b.receipt.uploadedAt)}</td>
          <td><span class="status status-${b.status}">${b.status.replaceAll("_"," ")}</span></td>
          <td>
            <a class="link-btn" target="_blank" href="${b.receipt.dataUrl}">View</a> ·
            <a class="link-btn" href="#bookings/${b.id}">Open Booking</a>
          </td>
        </tr>`).join("") : `<tr><td colspan="5" style="color:var(--text-500);">No receipts uploaded yet.</td></tr>`}</tbody>
      </table></div>
    </div>`;
}

/* ---------------- INVOICES ---------------- */
function renderInvoices() {
  const list = DB.bookings.filter((b) => b.invoiceId);
  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>Invoices (${list.length})</h3>
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Invoice #</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${list.length ? list.map((b) => `<tr>
          <td>${b.invoiceId}</td><td>${b.bookingId}</td><td>${b.name}</td><td>${fmtCurrency(b.totalAmount)}</td>
          <td><span class="status status-${b.status}">${b.status.replaceAll("_"," ")}</span></td>
          <td><a class="link-btn" target="_blank" href="invoice.html?booking=${b.bookingId}">View / Print</a></td>
        </tr>`).join("") : `<tr><td colspan="6" style="color:var(--text-500);">No invoices generated yet.</td></tr>`}</tbody>
      </table></div>
    </div>`;
}

/* ---------------- SETTINGS ---------------- */
function renderSettings() {
  const s = DB.settings;
  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>Business Settings</h3>
      <form onsubmit="saveSettings(event)" class="form-grid cols-3">
        <div class="field"><label>Business Name</label><input name="businessName" value="${s.businessName}"></div>
        <div class="field"><label>Phone</label><input name="phone" value="${s.phone}"></div>
        <div class="field"><label>WhatsApp (with country code, no +)</label><input name="whatsapp" value="${s.whatsapp}"></div>
        <div class="field"><label>Email</label><input name="email" value="${s.email}"></div>
        <div class="field full"><label>Address</label><input name="address" value="${s.address}"></div>
        <div class="field"><label>UPI ID</label><input name="upiId" value="${s.upiId}"></div>
        <div class="field"><label>UPI Display Name</label><input name="upiDisplayName" value="${s.upiDisplayName}"></div>
        <div class="field"><label>Invoice Prefix</label><input name="invoicePrefix" value="${s.invoicePrefix}"></div>
        <div class="field"><label>Booking Prefix</label><input name="bookingPrefix" value="${s.bookingPrefix}"></div>
        <div class="field"><label>Default Advance %</label><input type="number" name="defaultAdvancePercent" value="${s.defaultAdvancePercent}"></div>
        <div class="field full"><label>Terms</label><textarea name="terms" rows="2">${s.terms}</textarea></div>
        <div class="field full"><label>Cancellation Policy</label><textarea name="cancellationPolicy" rows="2">${s.cancellationPolicy}</textarea></div>
        <div class="field full"><label>Footer Text</label><input name="footerText" value="${s.footerText}"></div>
        <div class="modal-actions"><button class="btn btn-primary" type="submit">Save Settings</button></div>
      </form>
    </div>
    <div class="admin-panel-card" style="border-color:var(--warning);background:var(--warning-bg);">
      <h3 style="color:var(--warning);">Security Notice</h3>
      <p style="font-size:13px;">This demo stores data in the browser's local storage and uses a client-side login for convenience only. Before going live, connect real authentication and a database — see README.md and the /api folder.</p>
    </div>`;
}
function saveSettings(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  DB.settings = { ...DB.settings, ...Object.fromEntries(fd.entries()) };
  persistAndRerender("Settings saved.");
}

/* ============================================================
   GENERIC CRUD MANAGER (vehicles / destinations / tours / services)
   ============================================================ */
function fieldsToFormHtml(fields, item) {
  return fields
    .map((f) => {
      const raw = item[f.key];
      const val = Array.isArray(raw) ? raw.join(", ") : raw !== undefined ? raw : "";
      if (f.type === "textarea") return `<div class="field full"><label>${f.label}</label><textarea name="${f.key}" rows="2">${val}</textarea></div>`;
      if (f.type === "checkbox") return `<div class="field"><label>${f.label}</label><select name="${f.key}"><option value="true" ${raw ? "selected" : ""}>Yes</option><option value="false" ${!raw ? "selected" : ""}>No</option></select></div>`;
      return `<div class="field"><label>${f.label}</label><input name="${f.key}" type="${f.type || "text"}" value="${val}"></div>`;
    })
    .join("");
}
function formToItem(fields, fd) {
  const item = {};
  fields.forEach((f) => {
    let v = fd.get(f.key);
    if (f.type === "checkbox") v = v === "true";
    else if (f.type === "csv") v = v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
    else if (f.type === "number") v = Number(v) || 0;
    item[f.key] = v;
  });
  return item;
}

function renderManager(collectionKey, fields, opts) {
  const items = DB[collectionKey];
  const editingId = MANAGER_EDIT_ID[collectionKey];
  const editing = editingId ? items.find((i) => i.id === editingId) : null;

  document.getElementById("admin-content").innerHTML = `
    <div class="admin-panel-card">
      <h3>${editing ? "Edit" : "Add New"} ${opts.singular}</h3>
      <form onsubmit="saveManagerItem(event,'${collectionKey}')" class="form-grid cols-3">
        ${fieldsToFormHtml(fields, editing || {})}
        <div class="modal-actions">
          <button class="btn btn-primary" type="submit">${editing ? "Save Changes" : "Add " + opts.singular}</button>
          ${editing ? `<button type="button" class="btn btn-outline" onclick="cancelManagerEdit('${collectionKey}')">Cancel</button>` : ""}
        </div>
      </form>
    </div>
    <div class="admin-panel-card">
      <h3>${opts.plural} (${items.length})</h3>
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Name</th><th>Details</th><th>Featured</th><th>Actions</th></tr></thead>
        <tbody>${items
          .map(
            (i) => `<tr>
          <td><b>${i[opts.nameKey]}</b></td>
          <td>${opts.summary(i)}</td>
          <td>${i.featured ? `<span class="status status-BOOKING_CONFIRMED">Featured</span>` : "—"}</td>
          <td><button class="link-btn" onclick="editManagerItem('${collectionKey}','${i.id}')">${icon("edit", 13)} Edit</button> ·
              <button class="link-btn" style="color:var(--danger);" onclick="deleteManagerItem('${collectionKey}','${i.id}')">${icon("trash", 13)} Delete</button></td>
        </tr>`
          )
          .join("")}</tbody>
      </table></div>
    </div>`;
}
function editManagerItem(collectionKey, id) {
  MANAGER_EDIT_ID[collectionKey] = id;
  renderRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function cancelManagerEdit(collectionKey) {
  MANAGER_EDIT_ID[collectionKey] = null;
  renderRoute();
}
function deleteManagerItem(collectionKey, id) {
  if (!confirm("Delete this item? This cannot be undone.")) return;
  DB[collectionKey] = DB[collectionKey].filter((i) => i.id !== id);
  saveDB(DB);
  toast("Deleted.");
  renderRoute();
}
function saveManagerItem(e, collectionKey) {
  e.preventDefault();
  const fieldsMap = { vehicles: VEHICLE_FIELDS, destinations: DEST_FIELDS, tours: TOUR_FIELDS, services: SERVICE_FIELDS };
  const fields = fieldsMap[collectionKey];
  const fd = new FormData(e.target);
  const data = formToItem(fields, fd);
  const editingId = MANAGER_EDIT_ID[collectionKey];
  if (editingId) {
    const idx = DB[collectionKey].findIndex((i) => i.id === editingId);
    DB[collectionKey][idx] = { ...DB[collectionKey][idx], ...data };
    MANAGER_EDIT_ID[collectionKey] = null;
    toast("Saved changes.");
  } else {
    DB[collectionKey].push({ id: uid(collectionKey.slice(0, 3)), ...data });
    toast("Added successfully.");
  }
  saveDB(DB);
  renderRoute();
}

/* ---- Field configs per collection ---- */
const VEHICLE_FIELDS = [
  { key: "name", label: "Vehicle Name" },
  { key: "category", label: "Category" },
  { key: "seats", label: "Seats" },
  { key: "img", label: "Image URL" },
  { key: "desc", label: "Description", type: "textarea" },
  { key: "bestFor", label: "Best For (comma separated)", type: "csv" },
  { key: "tags", label: "Filter Tags: Family/Premium/Group/Budget (comma separated)", type: "csv" },
  { key: "ac", label: "AC", type: "checkbox" },
  { key: "available", label: "Available", type: "checkbox" },
  { key: "featured", label: "Featured", type: "checkbox" },
];
const DEST_FIELDS = [
  { key: "name", label: "Destination Name" },
  { key: "place", label: "Location Note" },
  { key: "img", label: "Image URL" },
  { key: "desc", label: "Description", type: "textarea" },
  { key: "featured", label: "Featured (shows in homepage hero)", type: "checkbox" },
];
const TOUR_FIELDS = [
  { key: "name", label: "Package Name" },
  { key: "route", label: "Route" },
  { key: "duration", label: "Duration" },
  { key: "vehicle", label: "Recommended Vehicle" },
  { key: "price", label: "Starting Price (optional)" },
  { key: "img", label: "Image URL" },
  { key: "highlights", label: "Highlights (comma separated)", type: "csv" },
  { key: "featured", label: "Featured", type: "checkbox" },
];
const SERVICE_FIELDS = [
  { key: "title", label: "Service Title" },
  { key: "icon", label: "Icon (car/compass/plane/heart/users/briefcase/sun/train)" },
  { key: "desc", label: "Description", type: "textarea" },
];

function renderVehiclesManager() {
  renderManager("vehicles", VEHICLE_FIELDS, {
    singular: "Vehicle", plural: "Vehicles", nameKey: "name",
    summary: (v) => `${v.category} · ${v.seats}`,
  });
}
function renderDestinationsManager() {
  renderManager("destinations", DEST_FIELDS, {
    singular: "Destination", plural: "Destinations", nameKey: "name",
    summary: (d) => d.place,
  });
}
function renderToursManager() {
  renderManager("tours", TOUR_FIELDS, {
    singular: "Tour Package", plural: "Tour Packages", nameKey: "name",
    summary: (t) => `${t.route} · ${t.duration}`,
  });
}
function renderServicesManager() {
  renderManager("services", SERVICE_FIELDS, {
    singular: "Service", plural: "Services", nameKey: "title",
    summary: (s) => s.desc,
  });
}

/* ---------------- TOAST ---------------- */
function toast(msg, type = "success") {
  let wrap = document.getElementById("toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toast-wrap";
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

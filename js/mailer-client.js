/* ============================================================
   MAILER CLIENT — calls the real /api/send-email endpoint.
   Shared by site.js, payment.js and admin.js.

   Logs every attempt into DB.emailLogs so the admin panel's
   "Email History" / "Resend Email" features (Admin → open a
   booking) have real data to show — this is the closest this
   localStorage-based demo can get to spec section 30 without a
   server database. Once a real DB exists, swap emailLogs writes
   here for a server-side write in api/send-email.js itself.
   ============================================================ */

/**
 * Sends a transactional email for a booking event and records the
 * attempt in DB.emailLogs (success or failure — never silent).
 * @param {string} type - one of the keys in api/_lib/emailTemplates.js TEMPLATES
 * @param {object} booking - the booking record (must include bookingId, email/customerEmail)
 * @param {object} [extra] - extra template-specific data (e.g. { reason }, { vehicle, driver }, { charges, finalAmountDue })
 */
async function sendTransactionalEmail(type, booking, extra = {}) {
  const db = typeof DB !== "undefined" ? DB : loadDB();
  const to = booking.email || booking.customerEmail;
  const logEntry = {
    id: uid("mail"),
    bookingId: booking.bookingId,
    emailType: type,
    recipient: to || "(no email on file)",
    subject: "",
    providerMessageId: null,
    status: "FAILED",
    errorMessage: null,
    sentAt: new Date().toISOString(),
  };

  if (!to) {
    logEntry.errorMessage = "No email address on file for this booking — email not sent.";
    persistEmailLog(logEntry);
    return { success: false, error: logEntry.errorMessage };
  }

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        to,
        data: {
          booking,
          business: db.settings
            ? {
                name: db.settings.businessName,
                address: db.settings.address,
                phone: db.settings.phone,
                whatsapp: db.settings.whatsapp,
                email: db.settings.email,
              }
            : undefined,
          ...extra,
        },
      }),
    });
    const result = await res.json();

    logEntry.subject = result.subject || "";
    if (result.success) {
      logEntry.status = "SENT";
      logEntry.providerMessageId = result.id || null;
    } else {
      logEntry.status = "FAILED";
      logEntry.errorMessage = result.error || "Unknown error sending email.";
    }
    persistEmailLog(logEntry);
    return result;
  } catch (err) {
    // Typically means /api isn't reachable (e.g. opened via file:// instead
    // of a real deployment, or RESEND_API_KEY isn't configured yet).
    logEntry.errorMessage = "Could not reach the email API (" + (err.message || err) + "). This works once deployed to Vercel with RESEND_API_KEY set.";
    persistEmailLog(logEntry);
    return { success: false, error: logEntry.errorMessage };
  }
}

function persistEmailLog(entry) {
  const db = loadDB();
  db.emailLogs = db.emailLogs || [];
  db.emailLogs.unshift(entry);
  saveDB(db);
  if (typeof DB !== "undefined") DB = db;
}

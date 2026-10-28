/**
 * emailService.js
 * Production-Ready Transactional Email Service for iMovies powered by Brevo (Sendinblue)
 * Uses official @getbrevo/brevo SDK
 * Implements Amazon Prime Video aesthetic (#0f171e, #1a242f, #00a8e1)
 */

const { BrevoClient } = require('@getbrevo/brevo');
const emailConfig = require('../config/emailConfig');

// Initialize Brevo Client
let brevoClient = null;
if (emailConfig.isConfigured && emailConfig.BREVO_API_KEY) {
  try {
    brevoClient = new BrevoClient({ apiKey: emailConfig.BREVO_API_KEY });
    console.log('[emailService] ✅ Brevo Transactional Email client initialized.');
  } catch (err) {
    console.warn('[emailService] ⚠️ Failed to initialize Brevo client:', err.message);
  }
} else {
  console.warn('[emailService] ⚠️ Brevo client not initialized — BREVO_API_KEY missing. Email sending is disabled.');
}

/**
 * No-op stub returned when email service is not configured.
 */
const emailDisabledResult = (context) => {
  console.warn(`[emailService] ⚠️ Email skipped (${context}): BREVO_API_KEY not configured.`);
  return { success: false, error: 'Email service not configured. Set BREVO_API_KEY in your environment.' };
};

/**
 * Helper to normalize recipients into array of { email, name }
 */
const normalizeRecipients = (to) => {
  if (!to) return [];
  if (Array.isArray(to)) {
    return to.map((item) => (typeof item === 'string' ? { email: item.trim() } : item));
  }
  if (typeof to === 'string') {
    return [{ email: to.trim() }];
  }
  if (typeof to === 'object' && to.email) {
    return [{ email: to.email.trim(), name: to.name }];
  }
  return [];
};

/**
 * Handle and structure errors from Brevo SDK with HTTP 429 & rate-limit resilience
 */
const handleBrevoError = (error, context = '') => {
  const status = error.statusCode || error.status || (error.response ? error.response.status : null);
  const body = error.body || (error.response ? error.response.body : null);
  const message = error.message || 'Unknown Brevo error';

  if (status === 429) {
    console.error(`[emailService Rate Limit 429] ${context}: Brevo API rate limit exceeded. Backoff recommended.`, body);
  } else if (status === 401 || status === 403) {
    console.error(`[emailService Auth ${status}] ${context}: Invalid Brevo API Key or unauthorized sender.`, body);
  } else if (status === 400) {
    console.error(`[emailService Bad Request 400] ${context}: Invalid email payload parameters.`, body);
  } else {
    console.error(`[emailService Failure] ${context}: ${message}`, body || error);
  }

  return {
    success: false,
    status,
    error: message,
    details: body
  };
};

/**
 * Base Method: sendEmail
 * Sends a transactional email using raw HTML or text content
 */
const sendEmail = async ({
  to,
  subject,
  htmlContent,
  textContent,
  params = {},
  tags = ['transactional'],
  attachment = null,
  retryCount = 1
}) => {
  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    console.warn('[emailService] sendEmail aborted: No recipients specified.');
    return { success: false, error: 'Recipient email is required' };
  }

  if (!brevoClient) {
    return emailDisabledResult(`sendEmail to ${recipients[0]?.email}`);
  }

  const payload = {
    sender: {
      name: emailConfig.SENDER_NAME,
      email: emailConfig.SENDER_EMAIL
    },
    replyTo: {
      name: emailConfig.SENDER_NAME,
      email: emailConfig.SENDER_EMAIL
    },
    to: recipients,
    subject: subject || 'Notification from iMovies'
  };

  if (htmlContent) {
    payload.htmlContent = htmlContent;
  }

  if (textContent && typeof textContent === 'string' && textContent.trim().length > 0) {
    payload.textContent = textContent.trim();
  } else if (!htmlContent) {
    payload.textContent = 'Notification from iMovies';
  }

  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    payload.params = params;
  }

  if (Array.isArray(tags) && tags.length > 0) {
    payload.tags = tags;
  }

  if (Array.isArray(attachment) && attachment.length > 0) {
    payload.attachment = attachment;
  }

  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail(payload);
    const messageId = response?.messageId || response?.messageIds?.[0] || 'sent';
    console.log(`[emailService] Transactional email dispatched to [${recipients.map((r) => r.email).join(', ')}] | MessageID: ${messageId}`);
    return { success: true, messageId, response };
  } catch (error) {
    // Retry once on transient network errors (HTTP 5xx or connection drops)
    const status = error.statusCode || error.status;
    if (retryCount > 0 && (!status || status >= 500)) {
      console.warn(`[emailService] Retrying sendEmail to [${recipients[0]?.email}] due to transient network failure...`);
      await new Promise((res) => setTimeout(res, 1200));
      return sendEmail({ to, subject, htmlContent, textContent, params, tags, attachment, retryCount: retryCount - 1 });
    }
    return handleBrevoError(error, `sendEmail to ${recipients[0]?.email}`);
  }
};

/**
 * Base Method: sendTemplateEmail
 * Sends an email using a registered Brevo template ID
 */
const sendTemplateEmail = async ({ to, templateId, params = {}, tags = ['template'] }) => {
  const recipients = normalizeRecipients(to);
  if (recipients.length === 0 || !templateId) {
    return { success: false, error: 'Recipient and templateId are required' };
  }

  if (!brevoClient) {
    return emailDisabledResult(`sendTemplateEmail #${templateId}`);
  }

  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      sender: { name: emailConfig.SENDER_NAME, email: emailConfig.SENDER_EMAIL },
      to: recipients,
      templateId: Number(templateId),
      params,
      tags
    });
    return { success: true, messageId: response?.messageId, response };
  } catch (error) {
    return handleBrevoError(error, `sendTemplateEmail #${templateId}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-LEVEL FEATURE WRAPPERS (AMAZON PRIME VIDEO AESTHETIC)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrapper: sendVerificationEmail
 * Sends account activation email containing BOTH:
 * 1. Prominent 6-digit One-Time Password (OTP) for in-app verification
 * 2. Instant one-click verification link
 *
 * Supports both call styles:
 *   sendVerificationEmail(email, tokenOrLink, otp)
 *   sendVerificationEmail(email, { verificationToken, verificationLink, otp, username })
 */
const sendVerificationEmail = async (email, arg2, arg3) => {
  let verificationToken = '';
  let verificationLink = '';
  let otp = '';
  let username = 'Prime Movie Member';

  if (typeof arg2 === 'object' && arg2 !== null) {
    verificationToken = arg2.verificationToken || '';
    verificationLink  = arg2.verificationLink || '';
    otp               = arg2.otp || '';
    username          = arg2.username || username;
  } else {
    // Positional style: (email, tokenOrLink, otp)
    if (typeof arg2 === 'string') {
      if (arg2.startsWith('http://') || arg2.startsWith('https://')) {
        verificationLink = arg2;
      } else {
        verificationToken = arg2;
      }
    }
    if (typeof arg3 === 'string' || typeof arg3 === 'number') {
      otp = String(arg3);
    }
  }

  const clientBase = emailConfig.CLIENT_URL || 'http://localhost:5173';
  const directLink = verificationLink || `${clientBase}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  const displayOtp = otp || '123456';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your iMovies Account</title>
      <style>
        body { margin: 0; padding: 24px; background-color: #0b1118; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 580px; margin: 0 auto; background: #0f171e; border-radius: 12px; overflow: hidden; border: 1px solid #1a242f; box-shadow: 0 16px 36px rgba(0,0,0,0.8); }
        .header { background: #1a242f; padding: 28px 24px; text-align: center; border-bottom: 2px solid #00a8e1; }
        .prime-badge { display: inline-block; background: #00a8e1; color: #0f171e; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
        .logo { font-size: 30px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin: 0; }
        .logo span { color: #00a8e1; }
        .content { padding: 32px 28px; }
        h2 { font-size: 22px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 700; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
        .otp-box { background: #1a242f; border: 2px dashed #00a8e1; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0; }
        .otp-label { color: #00a8e1; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 6px; }
        .otp-code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: 10px; margin: 8px 0; text-shadow: 0 0 12px rgba(0,168,225,0.4); }
        .otp-expiry { color: #64748b; font-size: 12px; font-weight: 500; }
        .divider { text-align: center; margin: 26px 0; position: relative; }
        .divider::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #232f3e; }
        .divider span { background: #0f171e; position: relative; padding: 0 16px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .btn-wrap { text-align: center; margin: 24px 0 16px; }
        .btn-prime { display: inline-block; background: #00a8e1; color: #0f171e !important; text-decoration: none; padding: 14px 34px; border-radius: 6px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(0,168,225,0.35); }
        .footer { background: #0a0e14; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1a242f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="prime-badge">PRIME VIDEO CINEMA</div>
          <div class="logo"><span>i</span>Movies</div>
        </div>
        <div class="content">
          <h2>Welcome, ${username}!</h2>
          <p>Thank you for creating an account on iMovies. Please authenticate your email using the One-Time Password (OTP) below to activate your account and start booking cinema tickets:</p>

          <div class="otp-box">
            <div class="otp-label">Your Account Verification Code</div>
            <div class="otp-code">${displayOtp}</div>
            <div class="otp-expiry">⏱ Valid for the next 15 minutes</div>
          </div>

          <div class="divider">
            <span>OR ACTIVATE VIA DIRECT LINK</span>
          </div>

          <div class="btn-wrap">
            <a href="${directLink}" class="btn-prime" target="_blank">Verify My Account</a>
          </div>

          <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
            If you did not register for an account on iMovies, please disregard this email.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} iMovies. Powered by Brevo Transactional Email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🎬 Your iMovies Verification Code: ${displayOtp}`,
    htmlContent,
    textContent: `Welcome to iMovies! Your verification OTP code is: ${displayOtp}. Or verify your account here: ${directLink}`,
    tags: ['auth', 'verification']
  });
};

/**
 * Wrapper: sendPasswordResetEmail
 * Sends a secure password recovery email containing:
 * 1. 6-digit OTP code to enter in the password recovery modal
 * 2. Secure one-click recovery link
 *
 * Supports both call styles:
 *   sendPasswordResetEmail(email, tokenOrLink, otp)
 *   sendPasswordResetEmail(email, { resetToken, resetLink, otp, username })
 */
const sendPasswordResetEmail = async (email, arg2, arg3) => {
  let resetToken = '';
  let resetLink = '';
  let otp = '';
  let username = 'Prime Member';

  if (typeof arg2 === 'object' && arg2 !== null) {
    resetToken = arg2.resetToken || '';
    resetLink  = arg2.resetLink || '';
    otp        = arg2.otp || '';
    username   = arg2.username || username;
  } else {
    // Positional style: (email, tokenOrLink, otp)
    if (typeof arg2 === 'string') {
      if (arg2.startsWith('http://') || arg2.startsWith('https://')) {
        resetLink = arg2;
      } else {
        resetToken = arg2;
      }
    }
    if (typeof arg3 === 'string' || typeof arg3 === 'number') {
      otp = String(arg3);
    }
  }

  const clientBase = emailConfig.CLIENT_URL || 'http://localhost:5173';
  const directLink = resetLink || `${clientBase}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  const displayOtp = otp || '987654';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your iMovies Password</title>
      <style>
        body { margin: 0; padding: 24px; background-color: #0b1118; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 580px; margin: 0 auto; background: #0f171e; border-radius: 12px; overflow: hidden; border: 1px solid #1a242f; box-shadow: 0 16px 36px rgba(0,0,0,0.8); }
        .header { background: #1a242f; padding: 28px 24px; text-align: center; border-bottom: 2px solid #00a8e1; }
        .badge { display: inline-block; background: #00a8e1; color: #0f171e; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
        .logo { font-size: 30px; font-weight: 800; color: #ffffff; letter-spacing: 1px; margin: 0; }
        .logo span { color: #00a8e1; }
        .content { padding: 32px 28px; }
        h2 { font-size: 22px; color: #ffffff; margin-top: 0; margin-bottom: 12px; font-weight: 700; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
        .otp-box { background: #1a242f; border: 2px dashed #00a8e1; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0; }
        .otp-label { color: #00a8e1; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 6px; }
        .otp-code { font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: 10px; margin: 8px 0; text-shadow: 0 0 12px rgba(0,168,225,0.4); }
        .otp-expiry { color: #64748b; font-size: 12px; font-weight: 500; }
        .btn-wrap { text-align: center; margin: 24px 0 16px; }
        .btn-prime { display: inline-block; background: #00a8e1; color: #0f171e !important; text-decoration: none; padding: 14px 34px; border-radius: 6px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(0,168,225,0.35); }
        .security-alert { background: rgba(0,168,225,0.08); border-left: 4px solid #00a8e1; padding: 12px 16px; border-radius: 4px; color: #bae6fd; font-size: 13px; line-height: 1.5; margin-top: 24px; }
        .footer { background: #0a0e14; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1a242f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">ACCOUNT SECURITY</div>
          <div class="logo"><span>i</span>Movies</div>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>We received a request to reset your iMovies password. Enter the 6-digit recovery OTP code below on the login screen or click the recovery link:</p>

          <div class="otp-box">
            <div class="otp-label">Password Reset One-Time Password</div>
            <div class="otp-code">${displayOtp}</div>
            <div class="otp-expiry">⏱ Code expires in 15 minutes</div>
          </div>

          <div class="btn-wrap">
            <a href="${directLink}" class="btn-prime" target="_blank">Reset My Password</a>
          </div>

          <div class="security-alert">
            🛡️ <strong>Security Tip:</strong> If you did not request a password reset, please ignore this email. Your account password remains unchanged.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} iMovies. Powered by Brevo Transactional Email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🔑 Your iMovies Password Reset Code: ${displayOtp}`,
    htmlContent,
    textContent: `Hi ${username}, your password reset code is ${displayOtp}. Or reset via link: ${directLink}`,
    tags: ['auth', 'password-reset']
  });
};

/**
 * Wrapper: sendBookingConfirmationEmail
 * Sends a full digital cinema ticket confirmation with Prime Video aesthetic,
 * seat numbers, showtime, theatre name, QR code, and booking summary.
 */
const sendBookingConfirmationEmail = async (userEmail, bookingDetails = {}) => {
  if (!userEmail) {
    console.warn('[emailService] No recipient email specified for booking confirmation');
    return { success: false, error: 'Recipient email is required' };
  }

  const {
    bookingId = `BK-${Date.now().toString().slice(-8)}`,
    movieTitle,
    movieName,
    title,
    theatre,
    theatreName,
    showDate,
    date,
    showTime,
    showtime,
    time,
    seatNumbers,
    selectedSeats,
    seats,
    totalAmount,
    amount
  } = bookingDetails;

  const displayMovie = movieTitle || movieName || title || 'Cinema Feature';
  const displayTheatre = theatre || theatreName || 'iMovies Dolby Multiplex';
  const displayDate = showDate || date || new Date().toISOString().split('T')[0];
  const displayTime = showTime || showtime || time || '07:30 PM';

  // Format seat numbers
  let displaySeats = 'N/A';
  if (Array.isArray(seatNumbers)) {
    displaySeats = seatNumbers.join(', ');
  } else if (Array.isArray(selectedSeats)) {
    displaySeats = selectedSeats.join(', ');
  } else if (Array.isArray(seats)) {
    displaySeats = seats.join(', ');
  } else if (seatNumbers || selectedSeats || seats) {
    displaySeats = String(seatNumbers || selectedSeats || seats);
  }

  const displayAmount = totalAmount !== undefined
    ? Number(totalAmount).toLocaleString('en-IN')
    : (amount !== undefined ? Number(amount).toLocaleString('en-IN') : '250');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - iMovies</title>
      <style>
        body { margin: 0; padding: 24px; background-color: #0b1118; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background: #0f171e; border-radius: 12px; overflow: hidden; border: 1px solid #1a242f; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
        .header { background: #1a242f; padding: 30px 24px; text-align: center; border-bottom: 2px solid #00a8e1; }
        .prime-badge { display: inline-block; background: #00a8e1; color: #0f171e; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
        .brand { font-size: 30px; font-weight: 800; color: #ffffff; margin: 0; }
        .brand span { color: #00a8e1; }
        .subbrand { color: #94a3b8; font-size: 14px; margin-top: 4px; }
        .content { padding: 32px 28px; }
        .ticket-card { background: #1a242f; border: 2px dashed #00a8e1; border-radius: 12px; padding: 24px; margin-bottom: 24px; position: relative; }
        .status-badge { display: inline-block; background: rgba(0,168,225,0.15); color: #00a8e1; border: 1px solid #00a8e1; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px; }
        .movie-title { margin: 0 0 18px; font-size: 24px; font-weight: 800; color: #ffffff; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .table td { padding: 10px 0; border-bottom: 1px solid #243048; vertical-align: top; }
        .label { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; width: 40%; }
        .val { color: #f8fafc; font-size: 15px; font-weight: 600; text-align: right; width: 60%; }
        .seats-pill { background: #00a8e1; color: #0f171e; padding: 4px 12px; border-radius: 4px; display: inline-block; font-weight: 800; }
        .total-val { color: #00a8e1; font-size: 22px; font-weight: 900; }
        .ref-box { background: #0f171e; border-radius: 8px; padding: 16px; margin-top: 18px; border: 1px solid #243048; text-align: center; }
        .ref-label { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .booking-id { color: #00a8e1; font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 18px; font-weight: 800; letter-spacing: 2px; margin: 6px 0; }
        .instructions { background: rgba(0,168,225,0.06); border-left: 4px solid #00a8e1; padding: 14px 16px; border-radius: 4px; color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 24px; }
        .footer { background: #0a0e14; padding: 22px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1a242f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="prime-badge">PRIME VIDEO CINEMA PASS</div>
          <div class="brand"><span>i</span>Movies</div>
          <div class="subbrand">Official Digital Ticket & Receipt</div>
        </div>
        <div class="content">
          <div class="ticket-card">
            <span class="status-badge">● Confirmed & Verified</span>
            <div class="movie-title">${displayMovie}</div>

            <table class="table">
              <tr>
                <td class="label">Theatre / Multiplex</td>
                <td class="val">${displayTheatre}</td>
              </tr>
              <tr>
                <td class="label">Show Date</td>
                <td class="val">${displayDate}</td>
              </tr>
              <tr>
                <td class="label">Show Time</td>
                <td class="val">${displayTime}</td>
              </tr>
              <tr>
                <td class="label">Reserved Seats</td>
                <td class="val"><span class="seats-pill">${displaySeats}</span></td>
              </tr>
              <tr>
                <td class="label" style="font-weight: 700; color: #ffffff;">Amount Paid</td>
                <td class="val total-val">₹${displayAmount}</td>
              </tr>
            </table>

            <div class="ref-box">
              <div class="ref-label">Booking Reference Number</div>
              <div class="booking-id">${bookingId}</div>
              <div class="ref-label" style="margin-top: 4px;">Present this digital ticket at the theatre gate for direct entry</div>
            </div>
          </div>

          <div class="instructions">
            📌 <strong>Entry Guidelines:</strong> Please arrive 15 minutes before showtime. You can present this digital ticket pass directly on your smartphone screen at the cinema scanner.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} iMovies. Powered by Brevo Transactional Email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject: `🍿 Ticket Confirmed: ${displayMovie} [${bookingId}]`,
    htmlContent,
    textContent: `Your ticket for ${displayMovie} is confirmed! Booking ID: ${bookingId}, Seats: ${displaySeats}, Amount: ₹${displayAmount}.`,
    tags: ['booking', 'confirmation']
  });
};

/**
 * Wrapper: sendBookingStatusUpdateEmail
 * Notifies customer of changes to their booking status (e.g. Confirmed, Updated, Cancelled, Refunded)
 */
const sendBookingStatusUpdateEmail = async (email, statusDetails = {}) => {
  const {
    bookingId = 'N/A',
    movieName = 'Your Movie',
    status = 'Updated',
    refundAmount,
    reason = 'Administrative update',
    releasedSeats = []
  } = statusDetails;

  const isRefunded = String(status).toLowerCase().includes('refund');
  const isCancelled = String(status).toLowerCase().includes('cancel');

  const statusColor = isRefunded ? '#ef4444' : (isCancelled ? '#f59e0b' : '#00a8e1');
  const seatsText = Array.isArray(releasedSeats) ? releasedSeats.join(', ') : String(releasedSeats || '');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Booking Status Update - iMovies</title>
      <style>
        body { margin: 0; padding: 24px; background-color: #0b1118; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
        .container { max-width: 580px; margin: 0 auto; background: #0f171e; border-radius: 12px; overflow: hidden; border: 1px solid #1a242f; }
        .header { background: #1a242f; padding: 26px 24px; text-align: center; border-bottom: 2px solid ${statusColor}; }
        .brand { font-size: 28px; font-weight: 800; color: #ffffff; margin: 0; }
        .brand span { color: #00a8e1; }
        .body { padding: 32px 28px; }
        .badge { display: inline-block; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}; font-weight: 800; padding: 6px 14px; border-radius: 20px; font-size: 12px; text-transform: uppercase; margin-bottom: 16px; letter-spacing: 1px; }
        h2 { color: #ffffff; font-size: 20px; margin: 0 0 16px; font-weight: 700; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .info-card { background: #1a242f; border-radius: 8px; padding: 18px; border: 1px solid #243048; margin: 20px 0; }
        .footer { background: #0a0e14; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1a242f; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand"><span>i</span>Movies Notification</div>
        </div>
        <div class="body">
          <span class="badge">Status: ${status}</span>
          <h2>Update on Booking #${bookingId}</h2>
          <p>This is an automated notification regarding your cinema reservation for <strong>${movieName}</strong>.</p>

          <div class="info-card">
            <p style="margin: 6px 0;"><strong>Booking Reference:</strong> ${bookingId}</p>
            ${refundAmount ? `<p style="margin: 6px 0; color: #22c55e;"><strong>Refund Amount:</strong> ₹${Number(refundAmount).toLocaleString('en-IN')}</p>` : ''}
            ${seatsText ? `<p style="margin: 6px 0;"><strong>Seats Released:</strong> ${seatsText}</p>` : ''}
            <p style="margin: 6px 0;"><strong>Reason / Details:</strong> ${reason}</p>
          </div>

          <p>If you have any questions regarding this status change or require assistance, our support team is ready to help.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} iMovies. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `🔔 Booking Update: ${movieName} [${status}]`,
    htmlContent,
    textContent: `Your booking #${bookingId} for ${movieName} has been marked as ${status}.`,
    tags: ['booking', 'status-update']
  });
};

module.exports = {
  brevoClient,
  sendEmail,
  sendTemplateEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendTicketEmail: sendBookingConfirmationEmail, // Backwards compatible alias
  sendBookingStatusUpdateEmail
};

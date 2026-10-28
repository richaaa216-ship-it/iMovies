/**
 * emailController.js
 * Express controller exposing clean endpoints for all transactional email flows
 * Includes robust error handling, HTTP 429 rate-limit awareness, and structured logging
 */

const {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail
} = require('../services/emailService');
const emailConfig = require('../config/emailConfig');

/**
 * POST /api/email/test
 * Quick diagnostic test to verify Brevo configuration and send test email
 */
const testEmail = async (req, res) => {
  try {
    const to = (req.body && req.body.to) || (req.query && req.query.to) || emailConfig.SENDER_EMAIL;
    console.log(`[emailController] Dispatching Brevo test email to ${to}...`);

    const result = await sendEmail({
      to,
      subject: '🎬 iMovies Brevo Transactional Email Live Test',
      htmlContent: `
        <div style="font-family: -apple-system, sans-serif; background: #0f171e; color: #ffffff; padding: 28px; border-radius: 10px; max-width: 520px; border: 1px solid #1a242f;">
          <h2 style="color: #00a8e1; margin: 0 0 12px;">🎬 iMovies Email Gateway</h2>
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.5;">Your Brevo transactional email integration is operational and ready to dispatch account verifications, password recovery links, and cinema tickets.</p>
          <div style="background: #1a242f; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #00a8e1; margin: 16px 0; border: 1px solid #243048;">
            Sender: ${emailConfig.SENDER_NAME} &lt;${emailConfig.SENDER_EMAIL}&gt;
          </div>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      tags: ['test', 'diagnostic']
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test email successfully dispatched to ${to}`,
        messageId: result.messageId
      });
    }

    return res.status(result.status || 500).json({
      success: false,
      error: result.error || 'Failed to dispatch test email',
      details: result.details
    });
  } catch (error) {
    console.error('[emailController] Error in testEmail:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during email dispatch'
    });
  }
};

/**
 * POST /api/email/send-verification
 * Explicit endpoint to trigger account verification email with OTP and direct link
 * Body: { email, verificationToken, verificationLink, otp, username }
 */
const sendVerification = async (req, res) => {
  try {
    const { email, verificationToken, verificationLink, otp, username } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }

    const result = await sendVerificationEmail(email, {
      verificationToken,
      verificationLink,
      otp,
      username
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Account verification email dispatched to ${email}`,
        messageId: result.messageId
      });
    }

    return res.status(result.status || 500).json({
      success: false,
      error: result.error || 'Failed to send verification email',
      details: result.details
    });
  } catch (error) {
    console.error('[emailController] Error in sendVerification:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/email/send-reset
 * Explicit endpoint to trigger password reset email with OTP and direct link
 * Body: { email, resetToken, resetLink, otp, username }
 */
const sendPasswordReset = async (req, res) => {
  try {
    const { email, resetToken, resetLink, otp, username } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }

    const result = await sendPasswordResetEmail(email, {
      resetToken,
      resetLink,
      otp,
      username
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Password reset email dispatched to ${email}`,
        messageId: result.messageId
      });
    }

    return res.status(result.status || 500).json({
      success: false,
      error: result.error || 'Failed to send password reset email',
      details: result.details
    });
  } catch (error) {
    console.error('[emailController] Error in sendPasswordReset:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/email/send-booking (and /ticket-confirmation)
 * Explicit endpoint to trigger booking confirmation & cinema ticket email
 * Body: { email, bookingDetails }
 */
const sendBookingConfirmation = async (req, res) => {
  try {
    const { email, bookingDetails } = req.body;
    const recipient = email || (bookingDetails && bookingDetails.userEmail);

    if (!recipient || !bookingDetails) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email and bookingDetails object are required'
      });
    }

    const result = await sendBookingConfirmationEmail(recipient, bookingDetails);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Booking confirmation & digital ticket dispatched to ${recipient}`,
        messageId: result.messageId
      });
    }

    return res.status(result.status || 500).json({
      success: false,
      error: result.error || 'Failed to dispatch ticket email',
      details: result.details
    });
  } catch (error) {
    console.error('[emailController] Error in sendBookingConfirmation:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/email/send-status (and /status-update)
 * Explicit endpoint to trigger booking status update notification email
 * Body: { email, statusDetails }
 */
const sendBookingStatusUpdate = async (req, res) => {
  try {
    const { email, statusDetails } = req.body;
    const recipient = email || (statusDetails && statusDetails.userEmail);

    if (!recipient || !statusDetails) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email and statusDetails object are required'
      });
    }

    const result = await sendBookingStatusUpdateEmail(recipient, statusDetails);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Status update email dispatched to ${recipient}`,
        messageId: result.messageId
      });
    }

    return res.status(result.status || 500).json({
      success: false,
      error: result.error || 'Failed to dispatch status email',
      details: result.details
    });
  } catch (error) {
    console.error('[emailController] Error in sendBookingStatusUpdate:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  testEmail,
  sendVerification,
  sendPasswordReset,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  // Backwards-compatible aliases
  sendCustomTicketConfirmation: sendBookingConfirmation,
  sendCustomStatusUpdate: sendBookingStatusUpdate
};

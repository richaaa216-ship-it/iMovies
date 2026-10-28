/**
 * emailRoutes.js
 * Express router exposing endpoints for transactional email flows
 */

const express = require('express');
const router = express.Router();
const {
  testEmail,
  sendVerification,
  sendPasswordReset,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendCustomTicketConfirmation,
  sendCustomStatusUpdate
} = require('../controllers/emailController');

// 1. Diagnostics & Test Endpoint
router.get('/test', testEmail);
router.post('/test', testEmail);

// 2. Account Registration Verification (Link + OTP)
router.post('/send-verification', sendVerification);

// 3. Password Reset Recovery (Link + OTP)
router.post('/send-reset', sendPasswordReset);

// 4. Booking Confirmation & Digital Ticket
router.post('/send-booking', sendBookingConfirmation);
router.post('/ticket-confirmation', sendCustomTicketConfirmation);

// 5. Booking Status Notifications (Confirmed, Cancelled, Refunded, Updated)
router.post('/send-status', sendBookingStatusUpdate);
router.post('/status-update', sendCustomStatusUpdate);

module.exports = router;

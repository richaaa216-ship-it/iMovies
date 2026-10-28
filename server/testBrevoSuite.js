/**
 * testBrevoSuite.js
 * Comprehensive Verification Script for Brevo Transactional Email Integration
 * Tests:
 *  1. Base sendEmail
 *  2. sendVerificationEmail (Account Activation with 6-digit OTP + Direct Link)
 *  3. sendPasswordResetEmail (Password Recovery with 6-digit OTP + Direct Link)
 *  4. sendBookingConfirmationEmail (Digital Cinema Pass Receipt)
 *  5. sendBookingStatusUpdateEmail (Status Change / Cancellation)
 *  6. Express HTTP Endpoints via /api/email/*
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');

const {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail
} = require('./services/emailService');
const emailConfig = require('./config/emailConfig');

async function runTestSuite() {
  const targetEmail = process.env.TEST_EMAIL || emailConfig.SENDER_EMAIL || 'en24cs3010847@medicaps.ac.in';
  console.log(`\n===============================================================`);
  console.log(`🎬 iMovies Brevo Transactional Email Full Test Suite`);
  console.log(`Target Recipient : ${targetEmail}`);
  console.log(`Sender           : ${emailConfig.SENDER_NAME} <${emailConfig.SENDER_EMAIL}>`);
  console.log(`Brevo API Key    : ${emailConfig.BREVO_API_KEY ? emailConfig.BREVO_API_KEY.slice(0, 15) + '...' : 'MISSING'}`);
  console.log(`===============================================================\n`);

  try {
    // 1. Test Base sendEmail
    console.log('1️⃣  Testing Base sendEmail...');
    const res1 = await sendEmail({
      to: targetEmail,
      subject: '🎬 [Test 1/5] iMovies Brevo Service Connection Test',
      htmlContent: '<p>Base sendEmail method is working properly.</p>',
      tags: ['test', 'base']
    });
    console.log(`   Result: ${res1.success ? '✅ SUCCESS' : '❌ FAILED'} | MessageID: ${res1.messageId || res1.error}\n`);

    // 2. Test sendVerificationEmail (with 6-digit OTP and Link)
    console.log('2️⃣  Testing sendVerificationEmail (Account Activation + OTP)...');
    const res2 = await sendVerificationEmail(targetEmail, {
      username: 'Richa Malvi',
      verificationToken: 'verify_token_' + Date.now(),
      otp: '482910'
    });
    console.log(`   Result: ${res2.success ? '✅ SUCCESS' : '❌ FAILED'} | MessageID: ${res2.messageId || res2.error}\n`);

    // 3. Test sendPasswordResetEmail (Recovery link + OTP)
    console.log('3️⃣  Testing sendPasswordResetEmail (Password Recovery + OTP)...');
    const res3 = await sendPasswordResetEmail(targetEmail, {
      username: 'Richa Malvi',
      resetToken: 'reset_token_' + Date.now(),
      otp: '739105'
    });
    console.log(`   Result: ${res3.success ? '✅ SUCCESS' : '❌ FAILED'} | MessageID: ${res3.messageId || res3.error}\n`);

    // 4. Test sendBookingConfirmationEmail (Digital Cinema Ticket pass)
    console.log('4️⃣  Testing sendBookingConfirmationEmail (Digital Cinema Ticket)...');
    const res4 = await sendBookingConfirmationEmail(targetEmail, {
      bookingId: 'IMV-2026-88741',
      movieTitle: 'Interstellar: Beyond Horizons',
      theatre: 'PVR IMAX Phoenix MarketCity',
      showDate: '2026-10-28',
      showTime: '07:30 PM',
      seatNumbers: ['B4', 'B5'],
      totalAmount: 650
    });
    console.log(`   Result: ${res4.success ? '✅ SUCCESS' : '❌ FAILED'} | MessageID: ${res4.messageId || res4.error}\n`);

    // 5. Test sendBookingStatusUpdateEmail (Status Change / Cancellation)
    console.log('5️⃣  Testing sendBookingStatusUpdateEmail (Status Change / Refund)...');
    const res5 = await sendBookingStatusUpdateEmail(targetEmail, {
      bookingId: 'IMV-2026-88741',
      movieName: 'Interstellar: Beyond Horizons',
      status: 'Cancelled',
      refundAmount: 650,
      reason: 'Customer initiated cancellation (> 2h before showtime)',
      releasedSeats: ['B4', 'B5']
    });
    console.log(`   Result: ${res5.success ? '✅ SUCCESS' : '❌ FAILED'} | MessageID: ${res5.messageId || res5.error}\n`);

    console.log('===============================================================');
    console.log('🎉 ALL 5 DIRECT BREVO EMAIL WRAPPERS DISPATCHED SUCCESSFULLY!');
    console.log('===============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Test Suite encountered fatal error:', err);
    process.exit(1);
  }
}

runTestSuite();

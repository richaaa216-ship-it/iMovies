/**
 * emailConfig.js
 * Centralized Configuration & Environment Validation for Brevo Transactional Email Service
 */

require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY || null;
const SENDER_EMAIL  = process.env.SENDER_EMAIL  || 'en24cs3010847@medicaps.ac.in';
const SENDER_NAME   = process.env.SENDER_NAME   || 'iMovies';
const CLIENT_URL    = process.env.CLIENT_URL    || 'http://localhost:5173';

// Validate Brevo API Key format & configuration
const isConfigured = (() => {
  if (!BREVO_API_KEY) {
    console.warn(
      '[emailConfig] ⚠️  BREVO_API_KEY is not set in environment variables. ' +
      'Transactional emails will be skipped.'
    );
    return false;
  }
  if (!BREVO_API_KEY.startsWith('xkeysib-')) {
    console.warn('[emailConfig] ⚠️  BREVO_API_KEY does not appear to be a valid Sendinblue/Brevo v3 key (expected prefix: xkeysib-).');
    return false;
  }
  return true;
})();

module.exports = {
  BREVO_API_KEY,
  SENDER_EMAIL,
  SENDER_NAME,
  CLIENT_URL,
  isConfigured
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faEnvelope,
  faRotateRight,
  faArrowLeft,
  faCircleCheck,
  faWrench
} from '@fortawesome/free-solid-svg-icons';

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get email from URL query param, state, or localStorage
  const initialEmail = searchParams.get('email') || localStorage.getItem('imovies-pending-email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Countdown timer for Resend button
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Submit OTP for Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      toast.error('Please enter your email address');
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/auth/verify-otp', {
        email: cleanEmail,
        otp: cleanOtp
      });

      if (res.data && res.data.success) {
        setIsSuccess(true);
        toast.success(res.data.message || '🎉 Account verified successfully! Welcome to iMovies.');

        // Save session if JWT token returned
        if (res.data.token) {
          localStorage.setItem('imovies-user-token', res.data.token);
          localStorage.setItem(
            'imovies-user',
            JSON.stringify(res.data.user || { email: cleanEmail, role: 'user' })
          );
          localStorage.removeItem('imovies-pending-email');
        }

        setTimeout(() => {
          navigate('/home');
        }, 1800);
      } else {
        toast.error(res.data?.error || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Verification failed. In development, check your terminal or use code 123456.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Trigger backend Resend route
  const handleResendCode = async () => {
    if (!canResend) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter your email address to resend the code');
      return;
    }

    try {
      setCanResend(false);
      setResendCountdown(30);

      const res = await API.post('/auth/resend-otp', { email: cleanEmail });

      if (res.data?.otp) {
        setDevOtp(String(res.data.otp));
      }

      toast.success(
        res.data?.message ||
          'A fresh 6-digit verification code has been dispatched. Check your inbox or terminal.'
      );
    } catch (err) {
      setCanResend(true);
      const errorMsg = err.response?.data?.error || 'Failed to resend code. Please try again.';
      toast.error(errorMsg);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #151a28 0%, #0a0d14 70%, #05060a 100%)'
      }}
    >
      <div className="w-100" style={{ maxWidth: '440px' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <Link to="/landing" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-2">
            <span style={{ fontSize: '2.2rem' }}>🎬</span>
            <span className="fs-2 fw-extrabold text-white">
              <span style={{ color: 'var(--primary-red)' }}>i</span>Movies
            </span>
          </Link>
          <p className="text-secondary small mb-0">Two-Factor & Email Authentication Gateway</p>
        </div>

        {/* Verification Card */}
        <div className="dark-card p-4 p-sm-5 shadow-lg position-relative" style={{ border: '1px solid #282f44' }}>
          {isSuccess ? (
            <div className="text-center py-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e' }}
              >
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '32px', color: '#4ade80' }} />
              </div>
              <h4 className="text-white fw-bold mb-2">Account Verified!</h4>
              <p className="text-secondary small mb-3">
                Your email is confirmed and your account is active. Redirecting to movies...
              </p>
              <div className="spinner-border spinner-border-sm text-info" role="status"></div>
            </div>
          ) : (
            <div className="text-center">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: '60px', height: '60px', background: 'rgba(0, 168, 225, 0.15)', border: '1px solid #00a8e1' }}
              >
                <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: '26px', color: '#00a8e1' }} />
              </div>

              <h4 className="text-white fw-bold mb-1">Verify Your Account</h4>
              <p className="text-secondary small mb-3">
                Enter the 6-digit One-Time Password sent to your email.
              </p>

              {/* Local Dev Fallback Card */}
              <div
                className="p-3 mb-3 rounded-3 text-start small border"
                style={{
                  background: 'rgba(0, 168, 225, 0.08)',
                  borderColor: 'rgba(0, 168, 225, 0.35)'
                }}
              >
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <span className="text-info fw-bold d-block" style={{ fontSize: '0.82rem' }}>
                      <FontAwesomeIcon icon={faWrench} className="me-1" /> Local Development Mode
                    </span>
                    <span className="text-secondary" style={{ fontSize: '0.78rem' }}>
                      Check backend terminal for OTP or use master bypass code.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-prime-outline py-1 px-3 fw-bold"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => {
                      const code = devOtp || '123456';
                      setOtp(code);
                      toast.info(`Auto-filled code: ${code}`);
                    }}
                  >
                    Auto-Fill Code {devOtp ? `(${devOtp})` : '(123456)'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="text-start">
                {/* Target Email (Editable if needed) */}
                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary text-secondary" style={{ borderColor: '#333b50' }}>
                      <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <input
                      type="email"
                      className="form-control form-dark text-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                {/* OTP Digits */}
                <div className="mb-4 text-center">
                  <label className="form-label small text-secondary fw-semibold mb-2 d-block">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    className="form-control text-center text-white fw-bold mx-auto"
                    style={{
                      fontSize: '1.8rem',
                      letterSpacing: '10px',
                      background: '#0d111b',
                      border: '2px solid #00a8e1',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      maxWidth: '300px'
                    }}
                    autoFocus
                    required
                  />
                  <div className="text-secondary small mt-2">
                    ⏱ Valid for 15 minutes
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-prime w-100 py-3 fw-bold rounded-3 border-0 transition-all mb-3"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Verifying Code...
                    </span>
                  ) : (
                    'Verify & Activate Account'
                  )}
                </button>
              </form>

              {/* Resend and Navigation links */}
              <div className="d-flex align-items-center justify-content-between pt-3 border-top border-dark">
                <Link
                  to="/login"
                  className="btn btn-link text-secondary text-decoration-none p-0 small d-flex align-items-center gap-1"
                >
                  <FontAwesomeIcon icon={faArrowLeft} /> Back to Sign In
                </Link>

                <button
                  type="button"
                  className="btn btn-link text-decoration-none p-0 small fw-semibold"
                  style={{ color: canResend ? 'var(--primary-red)' : '#64748b' }}
                  onClick={handleResendCode}
                  disabled={!canResend}
                >
                  <FontAwesomeIcon icon={faRotateRight} className="me-1" />
                  {canResend ? 'Resend Code' : `Resend in ${resendCountdown}s`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import API from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCheckCircle, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

/**
 * Direct Booking Button
 * Directly saves the booking to MongoDB as a confirmed booking
 */
export default function CheckoutButton({
  bookingId,
  showId,
  amount,
  movieTitle = 'Movie Tickets',
  theatreName = '',
  selectedSeats = [],
  userEmail = '',
  onPaymentSuccess,
  onPaymentFailure,
  disabled = false,
  className = 'btn btn-primary-red w-100 py-2 fw-bold'
}) {
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    setLoading(true);
    try {
      const res = await API.post('/bookings', {
        showId,
        selectedSeats,
        movieName: movieTitle,
        theatreName,
        totalAmount: amount,
        userEmail
      });

      if (res.data && res.data.success) {
        toast.success('🎉 Booking Confirmed! Your tickets have been reserved.');
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      } else {
        throw new Error(res.data?.error || 'Booking creation failed');
      }
    } catch (err) {
      console.error('[CheckoutButton Booking Error]:', err);
      const msg = err.response?.data?.error || err.message || 'Booking failed';
      toast.error(msg);
      if (onPaymentFailure) {
        onPaymentFailure(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100">
      <button
        type="button"
        className={className}
        onClick={handleBooking}
        disabled={disabled || loading}
      >
        {loading ? (
          <span className="d-flex align-items-center justify-content-center gap-2">
            <span className="spinner-border spinner-border-sm" role="status"></span>
            Confirming Booking...
          </span>
        ) : (
          <span className="d-flex align-items-center justify-content-center gap-2">
            <FontAwesomeIcon icon={faCreditCard} />
            <span>Complete Payment • ₹{amount}</span>
          </span>
        )}
      </button>

      <div className="mt-2 text-center text-secondary small" style={{ fontSize: '0.72rem' }}>
        <FontAwesomeIcon icon={faShieldHalved} className="me-1 text-success" />
        Instant Confirmed Booking & Ticket Delivery
      </div>
    </div>
  );
}

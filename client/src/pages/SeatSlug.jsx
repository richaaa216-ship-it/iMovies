import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import API from '../utils/api';
import { isShowExpired } from '../utils/timeHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTv,
  faLock,
  faTicket,
  faClock,
  faCalendarAlt,
  faCheckCircle,
  faExclamationTriangle,
  faShieldHalved,
  faArrowLeft,
  faCreditCard,
  faQrcode,
  faBan
} from '@fortawesome/free-solid-svg-icons';

const BALCONY_ROWS = ['A', 'B', 'C'];
const BALCONY_COLS = 10;
const MIDDLE_ROWS = ['D', 'E', 'F', 'G', 'H'];
const MIDDLE_COLS = 12;
const LOWER_ROWS = ['I', 'J', 'K', 'L', 'M', 'N', 'O'];
const LOWER_COLS = 14;

export default function SeatSlug() {
  const { showId } = useParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [tickets, setTickets] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Flow States
  const [isLocked, setIsLocked] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [lockingInProgress, setLockingInProgress] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [createdBookingId, setCreatedBookingId] = useState(null);

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Retrieve userEmail from localStorage
  const userToken = localStorage.getItem('imovies-user-token');
  let userEmail = '';
  try {
    const storedUser = localStorage.getItem('imovies-user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      userEmail = (parsed.email || '').toLowerCase();
    }
  } catch (e) {
    console.error('Error parsing stored user:', e);
  }

  // Fetch show details
  const fetchShowData = async () => {
    try {
      const res = await API.get(`/shows/${showId}`);
      const showData = res.data?.show || res.data;
      if (showData) {
        setShow(showData);
        setTickets(showData.tickets || {});

        // Fetch Movie Details if movieId is present
        if (showData.movieId) {
          try {
            const mRes = await API.get(`/movies/${showData.movieId}`);
            setMovie(mRes.data?.movie || mRes.data);
          } catch (mErr) {
            console.warn('Could not load movie info:', mErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load show details:', err);
      toast.error('Unable to retrieve show information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();
  }, [showId]);

  // Connect to Socket.IO server & join room
  useEffect(() => {
    const backendHost =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '') ||
      'https://imovies1802.onrender.com';

    const socketHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? (import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//localhost:5000`)
        : backendHost;
    const socket = io(socketHost, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:show', showId);
    });

    // Real-time seat updates
    const handleSeatUpdate = (data) => {
      if (data && (!data.showId || data.showId === showId)) {
        if (data.tickets) {
          setTickets((prev) => ({ ...prev, ...data.tickets }));
        } else {
          // Re-fetch to ensure fresh data
          fetchShowData();
        }
      }
    };

    socket.on('seat:updated', handleSeatUpdate);
    socket.on('seats:locked', handleSeatUpdate);
    socket.on('seats:booked', handleSeatUpdate);
    socket.on('seats:cancelled', handleSeatUpdate);
    socket.on('show:updated', handleSeatUpdate);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [showId]);

  // Timer countdown management
  useEffect(() => {
    if (isLocked && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsLocked(false);
            setSelectedSeats([]);
            toast.warn('Lock expired! Your reserved seats have been released.');
            fetchShowData();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLocked, timeLeft]);

  // Helper to get status of a seat
  const getSeatStatus = (seatId) => {
    const ticket = tickets[seatId];
    if (!ticket) return 'available';

    // Check if booked
    if (ticket.status === 'booked') return 'booked';

    // Check if locked
    if (ticket.status === 'locked') {
      // If locked by current user in active session
      if (userEmail && ticket.lockedBy && ticket.lockedBy.toLowerCase() === userEmail.toLowerCase()) {
        if (selectedSeats.includes(seatId)) return 'selected';
      }
      return 'locked';
    }

    // Check if currently selected by user in UI
    if (selectedSeats.includes(seatId)) {
      return 'selected';
    }

    return 'available';
  };

  // Helper to get price of a seat
  const getSeatPrice = (seatId, tier) => {
    const ticket = tickets[seatId];
    if (ticket && ticket.price) return ticket.price;
    if (tier === 'balcony') return 300;
    if (tier === 'middle') return 200;
    return 150;
  };

  // Seat Click Handler
  const handleSeatClick = (seatId, tier) => {
    if (show && isShowExpired(show.showDate, show.showTime)) {
      toast.error('This show has already passed. Seat selection is disabled.');
      return;
    }

    if (isLocked) {
      toast.info('Seats are already locked. Proceed to Confirm Booking or wait for expiry.');
      return;
    }

    const status = getSeatStatus(seatId);

    if (status === 'booked') {
      toast.error(`Seat ${seatId} is already booked.`);
      return;
    }

    if (status === 'locked') {
      toast.error(`Seat ${seatId} is currently locked by another customer.`);
      return;
    }

    // Toggle Selection
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      } else {
        if (prev.length >= 8) {
          toast.warn('Maximum 8 seats can be selected per booking');
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  // Calculate pricing breakdown
  const calculatePricing = () => {
    let balconyCount = 0;
    let middleCount = 0;
    let lowerCount = 0;
    let balconyTotal = 0;
    let middleTotal = 0;
    let lowerTotal = 0;

    selectedSeats.forEach((seatId) => {
      const row = seatId.charAt(0);
      if (BALCONY_ROWS.includes(row)) {
        balconyCount++;
        balconyTotal += getSeatPrice(seatId, 'balcony');
      } else if (MIDDLE_ROWS.includes(row)) {
        middleCount++;
        middleTotal += getSeatPrice(seatId, 'middle');
      } else {
        lowerCount++;
        lowerTotal += getSeatPrice(seatId, 'lower');
      }
    });

    const subtotal = balconyTotal + middleTotal + lowerTotal;
    const bookingFee = selectedSeats.length > 0 ? selectedSeats.length * 20 : 0;
    const grandTotal = subtotal + bookingFee;

    return {
      balconyCount,
      middleCount,
      lowerCount,
      balconyTotal,
      middleTotal,
      lowerTotal,
      subtotal,
      bookingFee,
      grandTotal
    };
  };

  const pricing = calculatePricing();

  // Lock Seats Handler
  const handleLockSeats = async () => {
    if (show && isShowExpired(show.showDate, show.showTime)) {
      toast.error('This showtime has already passed and cannot be booked.');
      return;
    }

    if (!userToken) {
      toast.info('Please log in to proceed with booking');
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warn('Please select at least one seat to lock');
      return;
    }

    setLockingInProgress(true);
    try {
      const res = await API.post('/bookings/lock', {
        showId,
        selectedSeats,
        userEmail
      });

      if (res.data && res.data.success) {
        setIsLocked(true);
        setTimeLeft(600); // 10 minutes = 600s
        toast.success('Seats locked for 10 minutes! Please confirm your booking.');
      } else {
        toast.error(res.data?.error || 'Failed to lock seats');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to lock seats';
      toast.error(msg);
    } finally {
      setLockingInProgress(false);
    }
  };

  // ── Direct Booking Creation Flow ──────────────────────────────────────────
  // Calls POST /api/bookings to directly create and confirm the booking in MongoDB
  const handleConfirmBooking = async () => {
    if (show && isShowExpired(show.showDate, show.showTime)) {
      toast.error('This showtime has already passed and cannot be booked.');
      return;
    }

    if (!userToken) {
      toast.info('Please log in to confirm booking');
      navigate('/login');
      return;
    }

    if (!isLocked) {
      toast.warn('Please lock your seats before confirming booking');
      return;
    }

    setBookingInProgress(true);
    try {
      const parsedUser = JSON.parse(localStorage.getItem('imovies-user') || '{}');

      // Directly trigger the booking creation function
      const res = await API.post('/bookings', {
        showId,
        selectedSeats,
        movieId: show.movieId,
        movieName: movie?.movieName || movie?.title || show.theatreName,
        theatreId: show.theatreId,
        theatreName: show.theatreName,
        showDate: show.showDate,
        showTime: show.showTime,
        totalAmount: pricing.grandTotal,
        userEmail: userEmail || parsedUser.email || '',
        paymentMethod: 'Direct Booking'
      });

      if (res.data && res.data.success) {
        toast.success('🎉 Booking Confirmed! Your tickets have been reserved.');
        setIsLocked(false);
        navigate('/bookings');
      } else {
        throw new Error(res.data?.error || 'Booking creation failed');
      }
    } catch (err) {
      console.error('[Direct Booking Error]:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to complete booking';
      toast.error(msg);
    } finally {
      setBookingInProgress(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex flex-column">
        <Header />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <Loader message="Loading interactive seat map..." fullScreen={false} />
        </div>
        <Footer />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-vh-100 bg-dark text-white d-flex flex-column">
        <Header />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center text-center p-4">
          <div className="dark-card p-5">
            <h3 className="text-white fw-bold mb-3">Show Unavailable</h3>
            <p className="text-secondary mb-4">The show could not be found or has expired.</p>
            <button className="btn btn-primary-red" onClick={() => navigate('/home')}>
              Back to Movies
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const movieTitle = movie?.movieName || movie?.name || movie?.title || 'Movie Experience';

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-white" style={{ backgroundColor: 'var(--dark-bg)' }}>
      <Header />

      <main className="container-fluid flex-grow-1 px-3 px-md-4 py-4" style={{ maxWidth: '1400px' }}>
        {/* Top Header Information */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 mb-4 border-bottom border-dark">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-sm btn-outline-secondary mb-2 d-inline-flex align-items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </button>
            <h3 className="fw-bold mb-1 text-white">
              {movieTitle}
            </h3>
            <div className="text-secondary small d-flex flex-wrap align-items-center gap-3">
              <span><strong>Theatre:</strong> {show.theatreName} {show.screenName ? `(${show.screenName})` : ''}</span>
              <span>•</span>
              <span><FontAwesomeIcon icon={faCalendarAlt} className="me-1" />{show.showDate}</span>
              <span>•</span>
              <span><FontAwesomeIcon icon={faClock} className="me-1" />{show.showTime}</span>
            </div>
          </div>

          {/* Timer Banner (if locked) */}
          {isLocked && (
            <div className="badge bg-warning bg-opacity-25 border border-warning text-warning px-3 py-2 fs-6 rounded-pill d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faClock} />
              <span>Seats Locked: <strong>{formatTime(timeLeft)}</strong></span>
            </div>
          )}
        </div>

        {/* Showtime Expired Warning */}
        {show && isShowExpired(show.showDate, show.showTime) && (
          <div className="alert alert-danger d-flex align-items-center gap-3 mb-4 rounded-3 border-danger shadow-sm">
            <FontAwesomeIcon icon={faBan} className="fs-4 text-danger" />
            <div>
              <div className="fw-bold">Showtime Expired</div>
              <div className="small">
                This show ({show.showDate} at {show.showTime}) has already commenced or passed. Seat selection and ticket booking are disabled.
              </div>
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Left / Center: Interactive Seat Layout */}
          <div className="col-12 col-xl-8">
            <div className="dark-card p-4 text-center overflow-auto shadow-sm" style={{ border: '1px solid #23293b' }}>
              {/* TIER 1: BALCONY */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                  <span className="badge bg-danger bg-opacity-20 text-danger border border-danger fw-semibold px-2 py-1">
                    BALCONY TIER (₹300)
                  </span>
                  <span className="text-secondary small">Premium Viewing</span>
                </div>
                <div className="d-inline-block">
                  {BALCONY_ROWS.map((row) => (
                    <div key={row} className="d-flex align-items-center justify-content-center mb-1">
                      <span className="text-secondary fw-bold me-2" style={{ width: '20px' }}>
                        {row}
                      </span>
                      <div className="d-flex">
                        {Array.from({ length: BALCONY_COLS }, (_, i) => {
                          const seatId = `${row}${i + 1}`;
                          const status = getSeatStatus(seatId);
                          return (
                            <div
                              key={seatId}
                              className={`seat ${status}`}
                              onClick={() => handleSeatClick(seatId, 'balcony')}
                              title={`Seat ${seatId} - ₹300 (${status})`}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TIER 2: MIDDLE */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                  <span className="badge bg-primary bg-opacity-20 text-primary border border-primary fw-semibold px-2 py-1">
                    MIDDLE TIER (₹200)
                  </span>
                  <span className="text-secondary small">Standard Comfort</span>
                </div>
                <div className="d-inline-block">
                  {MIDDLE_ROWS.map((row) => (
                    <div key={row} className="d-flex align-items-center justify-content-center mb-1">
                      <span className="text-secondary fw-bold me-2" style={{ width: '20px' }}>
                        {row}
                      </span>
                      <div className="d-flex">
                        {Array.from({ length: MIDDLE_COLS }, (_, i) => {
                          const seatId = `${row}${i + 1}`;
                          const status = getSeatStatus(seatId);
                          return (
                            <div
                              key={seatId}
                              className={`seat ${status}`}
                              onClick={() => handleSeatClick(seatId, 'middle')}
                              title={`Seat ${seatId} - ₹200 (${status})`}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TIER 3: LOWER (Lowest-priced / Budget Friendly - Screen is adjacent to this tier) */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2 px-3">
                  <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary fw-semibold px-2 py-1">
                    LOWER TIER (₹150)
                  </span>
                  <span className="text-secondary small">Lowest Priced Tier (Front Rows)</span>
                </div>
                <div className="d-inline-block">
                  {LOWER_ROWS.map((row) => (
                    <div key={row} className="d-flex align-items-center justify-content-center mb-1">
                      <span className="text-secondary fw-bold me-2" style={{ width: '20px' }}>
                        {row}
                      </span>
                      <div className="d-flex">
                        {Array.from({ length: LOWER_COLS }, (_, i) => {
                          const seatId = `${row}${i + 1}`;
                          const status = getSeatStatus(seatId);
                          return (
                            <div
                              key={seatId}
                              className={`seat ${status}`}
                              onClick={() => handleSeatClick(seatId, 'lower')}
                              title={`Seat ${seatId} - ₹150 (${status})`}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Screen Indicator directly adjacent to the Lowest-Priced (Lower) Tier */}
              <div
                className="mt-4 pt-3 pb-3 text-center position-relative"
                role="region"
                aria-label="Cinema screen position: all eyes this way, facing lowest priced lower tier front seats"
              >
                <div
                  className="d-flex align-items-center justify-content-center gap-2 mb-2 fw-bold small text-uppercase"
                  style={{ letterSpacing: '4px', color: 'var(--prime-blue)' }}
                >
                  <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>▲</span>
                  <span>CINEMA SCREEN THIS WAY</span>
                  <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>▲</span>
                </div>
                <div style={{ perspective: '300px' }} className="d-flex justify-content-center">
                  <div
                    className="screen-curved"
                    style={{
                      width: '85%',
                      maxWidth: '640px',
                      height: '14px',
                      background: 'linear-gradient(180deg, #ffffff 0%, rgba(0, 168, 225, 0.9) 55%, transparent 100%)',
                      borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                      boxShadow: '0 -8px 30px rgba(0, 168, 225, 0.6), 0 -2px 10px rgba(0, 200, 255, 0.9)'
                    }}
                  ></div>
                </div>
                <div className="text-secondary fw-bold small mt-2" style={{ letterSpacing: '3px', fontSize: '0.8rem' }}>
                  🎬 ALL EYES THIS WAY — CINEMA SCREEN
                </div>
                <div className="text-secondary small opacity-75 mt-1" style={{ fontSize: '0.72rem' }}>
                  Positioned directly in front of Lower Tier (₹150 budget seats)
                </div>
              </div>

              {/* Seat Legend */}
              <div className="pt-4 border-top border-dark d-flex flex-wrap justify-content-center gap-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="seat available m-0" style={{ cursor: 'default' }}></div>
                  <span className="small text-secondary">Available</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="seat selected m-0" style={{ cursor: 'default' }}></div>
                  <span className="small text-secondary">Selected</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="seat locked m-0" style={{ cursor: 'default' }}></div>
                  <span className="small text-secondary">Locked (10m)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="seat booked m-0" style={{ cursor: 'default' }}></div>
                  <span className="small text-secondary">Booked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Panel: Booking Summary & Checkout */}
          <div className="col-12 col-xl-4">
            <div className="dark-card p-4 shadow-sm position-sticky" style={{ top: '85px', border: '1px solid #23293b' }}>
              <h4 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faTicket} style={{ color: 'var(--primary-red)' }} />
                <span>Booking Summary</span>
              </h4>

              {/* Selected Seats Badges */}
              <div className="mb-4">
                <label className="form-label small text-secondary fw-semibold">
                  Selected Seats ({selectedSeats.length})
                </label>
                {selectedSeats.length === 0 ? (
                  <p className="text-secondary small mb-0">No seats selected. Click any green seat to select.</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat}
                        className="badge bg-primary px-3 py-2 rounded-2 fs-6 fw-bold"
                        style={{ backgroundColor: 'var(--primary-blue)' }}
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: '#0d111b', border: '1px solid #23293b' }}>
                <h6 className="fw-bold text-white mb-2">Price Breakdown</h6>
                <div className="d-flex flex-column gap-2 small text-secondary">
                  {pricing.balconyCount > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Balcony ({pricing.balconyCount} × ₹300)</span>
                      <span className="text-white fw-semibold">₹{pricing.balconyTotal}</span>
                    </div>
                  )}
                  {pricing.middleCount > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Middle ({pricing.middleCount} × ₹200)</span>
                      <span className="text-white fw-semibold">₹{pricing.middleTotal}</span>
                    </div>
                  )}
                  {pricing.lowerCount > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Lower ({pricing.lowerCount} × ₹150)</span>
                      <span className="text-white fw-semibold">₹{pricing.lowerTotal}</span>
                    </div>
                  )}
                  {selectedSeats.length > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Convenience Fee (₹20/seat)</span>
                      <span className="text-white fw-semibold">₹{pricing.bookingFee}</span>
                    </div>
                  )}
                  <hr className="my-2 border-secondary" />
                  <div className="d-flex justify-content-between fs-6 fw-bold text-white">
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--primary-red)' }}>₹{pricing.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Lock Warning */}
              {isLocked ? (
                <div className="alert alert-warning py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} />
                  <span>
                    Seats held for <strong>{formatTime(timeLeft)}</strong>. Complete checkout to finalize your tickets.
                  </span>
                </div>
              ) : (
                <div className="alert alert-dark py-2 px-3 small rounded-3 mb-3 text-secondary border border-secondary">
                  <span>Step 1: Lock your selected seats to hold them for 10 minutes.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex flex-column gap-2">
                {/* 1. Lock Seats Button */}
                <button
                  type="button"
                  className="btn btn-primary-blue w-100 py-2 fw-bold"
                  onClick={handleLockSeats}
                  disabled={selectedSeats.length === 0 || isLocked || lockingInProgress || (show && isShowExpired(show.showDate, show.showTime))}
                >
                  {lockingInProgress ? (
                    'Locking Seats...'
                  ) : isLocked ? (
                    '✓ Seats Locked'
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faLock} />
                      <span>Lock Seats</span>
                    </>
                  )}
                </button>

                {/* 2. Complete Payment Button (Direct Booking) */}
                <button
                  type="button"
                  className="btn btn-primary-red w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                  onClick={handleConfirmBooking}
                  disabled={!isLocked || bookingInProgress || (show && isShowExpired(show.showDate, show.showTime))}
                  style={{ fontSize: '0.95rem' }}
                >
                  {bookingInProgress ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Confirming Booking...
                    </span>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCreditCard} />
                      <span>Complete Payment • ₹{pricing.grandTotal}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Booking Badge */}
              <div className="mt-3 text-center">
                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                  ⚡ <strong>Direct Booking Confirmation</strong> • Instant Seat Reservation & E-Ticket Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCouch,
  faBolt,
  faTicket,
  faFilm,
  faShieldHalved,
  faPlay,
  faStar,
  faClock,
  faUserPlus,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import API from '../utils/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const heroBanners = [
    {
      title: 'Interstellar: Beyond Horizons',
      subtitle: 'Christopher Nolan • Sci-Fi / Drama • 4K UHD • HDR',
      tagline: 'Mankind was born on Earth. It was never meant to die here.',
      backdrop: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&h=900&fit=crop',
      rating: '8.9',
      genres: ['Sci-Fi', 'Adventure', 'IMAX']
    },
    {
      title: 'Dune: The Prophecy',
      subtitle: 'Denis Villeneuve • Epic Adventure • Dolby Atmos',
      tagline: 'Beyond fear, destiny awaits across the sacred sands.',
      backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&h=900&fit=crop',
      rating: '8.8',
      genres: ['Sci-Fi', 'Action', '4K']
    },
    {
      title: 'CyberCity 2099',
      subtitle: 'Neo-Noir Thriller • 4K Laser Projection',
      tagline: 'In the shadows of neon skyscrapers, truth is the ultimate weapon.',
      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&h=900&fit=crop',
      rating: '8.7',
      genres: ['Action', 'Sci-Fi', 'Dolby']
    }
  ];

  useEffect(() => {
    // Fetch now showing movies for preview carousel
    API.get('/movies')
      .then((res) => {
        if (res.data?.movies) setFeaturedMovies(res.data.movies);
      })
      .catch(() => {});

    // Hero carousel auto-rotate
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentHero = heroBanners[currentHeroIndex];

  const handleQuickDemoLogin = async (role) => {
    try {
      if (role === 'admin') {
        const res = await API.post('/auth/admin/login', {
          email: 'admin@imovies.com',
          password: 'Admin@123'
        });
        if (res.data?.success) {
          localStorage.setItem('imovies-admin-token', res.data.token);
          localStorage.setItem('imovies-admin', JSON.stringify(res.data.admin));
          toast.success('Logged in as Demo Admin!');
          navigate('/admin');
        }
      } else {
        const res = await API.post('/auth/login', {
          email: 'user@imovies.com',
          password: 'User@123'
        });
        if (res.data?.success) {
          localStorage.setItem('imovies-user-token', res.data.token);
          localStorage.setItem('imovies-user', JSON.stringify(res.data.user));
          toast.success('Logged in as Demo Prime Member!');
          navigate('/home');
        }
      }
    } catch (err) {
      toast.error('Login error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="landing-page min-vh-100 d-flex flex-column text-white" style={{ backgroundColor: '#0f171e' }}>
      <Header />

      {/* Hero Billboard with Amazon Prime Video Gradient Overlay */}
      <section
        className="prime-hero-billboard position-relative d-flex align-items-center"
        style={{
          backgroundImage: `url(${currentHero.backdrop})`,
          minHeight: '75vh',
          backgroundPosition: 'center top',
          backgroundSize: 'cover',
          transition: 'background-image 0.8s ease-in-out'
        }}
      >
        <div className="prime-hero-gradient" />

        <div className="container position-relative py-5" style={{ zIndex: 10 }}>
          <div className="row align-items-center">
            <div className="col-lg-7">
              {/* Prime Pill Header */}
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="prime-badge px-2 py-1">INCLUDED WITH PRIME</span>
                <span className="cert-badge">U/A 16+</span>
                <span className="imdb-badge">
                  <FontAwesomeIcon icon={faStar} /> {currentHero.rating}
                </span>
                <span className="text-secondary small ms-2">{currentHero.subtitle}</span>
              </div>

              {/* Title */}
              <h1 className="display-4 fw-black text-white mb-2" style={{ fontWeight: 900, letterSpacing: '-1px' }}>
                {currentHero.title}
              </h1>

              {/* Tagline */}
              <p className="fs-5 text-light mb-4 opacity-90" style={{ maxWidth: '580px', lineHeight: 1.5 }}>
                {currentHero.tagline}
              </p>

              {/* Primary Call to Actions */}
              <div className="d-flex flex-wrap gap-3 align-items-center">
                <Link to="/register" className="btn btn-prime btn-lg px-4 py-3 fw-bold">
                  <FontAwesomeIcon icon={faTicket} />
                  Book Tickets Now
                </Link>
                <Link to="/login" className="btn btn-prime-outline btn-lg px-4 py-3 fw-bold">
                  Sign In to Prime
                </Link>
                <button
                  onClick={() => handleQuickDemoLogin('user')}
                  className="btn btn-prime-ghost btn-lg px-3 py-3"
                  title="One-click demo member login"
                >
                  ⚡ Try as Prime Member
                </button>
              </div>

              {/* Quick stats under buttons */}
              <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex gap-4 text-secondary small">
                <div>
                  <span className="text-white fw-bold">10-Min</span> Seat Lock TTL
                </div>
                <div>•</div>
                <div>
                  <span className="text-white fw-bold">3 Tiers</span> Balcony, Middle, Lower
                </div>
                <div>•</div>
                <div>
                  <span className="text-white fw-bold">Instant</span> QR E-Tickets
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Movies Carousel Preview */}
      <section className="py-5" style={{ backgroundColor: '#0f171e' }}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 className="prime-row-title mb-0">Now Showing in Theatres</h2>
              <div className="prime-row-subtitle">Book prime seats in top IMAX & Multiplex screens</div>
            </div>
            <Link to="/register" className="text-info small fw-bold text-decoration-none d-flex align-items-center gap-1">
              <span>View All Shows</span>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '0.8rem' }} />
            </Link>
          </div>

          <div className="prime-carousel-row">
            {featuredMovies.map((movie) => (
              <div key={movie._id} className="prime-carousel-item">
                <div
                  className="prime-movie-card h-100"
                  onClick={() => navigate('/login')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="position-relative overflow-hidden" style={{ height: '260px' }}>
                    <img
                      src={movie.posterUrl}
                      alt={movie.movieName}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 start-0 m-2">
                      <span className="prime-badge">PRIME</span>
                    </div>
                    <div className="position-absolute bottom-0 start-0 m-2">
                      <span className="imdb-badge">
                        <FontAwesomeIcon icon={faStar} /> {movie.rating || 8.4}
                      </span>
                    </div>
                  </div>
                  <div className="p-3" style={{ backgroundColor: '#151f28' }}>
                    <h6 className="text-white text-truncate fw-bold mb-1">{movie.movieName}</h6>
                    <div className="text-secondary small d-flex justify-content-between">
                      <span>{movie.language}</span>
                      <span>{movie.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-5" style={{ backgroundColor: '#141c24' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="prime-badge px-3 py-1 mb-2">NEXT-GEN CINEMA BOOKING</span>
            <h2 className="fw-black text-white mt-2">Why Cinephiles Choose iMovies</h2>
            <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Engineered with an Amazon Prime Video aesthetic, real-time WebSocket seat synchronization, and instant digital tickets.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="p-4 prime-card h-100 d-flex flex-column">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ width: '56px', height: '56px', backgroundColor: 'rgba(0, 168, 225, 0.15)', color: '#00a8e1', fontSize: '1.5rem' }}
                >
                  <FontAwesomeIcon icon={faCouch} />
                </div>
                <h5 className="fw-bold text-white mb-2">Tier-Based Interactive Maps</h5>
                <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                  Choose from luxurious Balcony Recliners (₹350), Executive Middle Seats (₹250), or Standard Lower Viewers (₹150) with high-res responsive maps.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 prime-card h-100 d-flex flex-column">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ width: '56px', height: '56px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '1.5rem' }}
                >
                  <FontAwesomeIcon icon={faBolt} />
                </div>
                <h5 className="fw-bold text-white mb-2">Real-Time Seat Locking & TTL</h5>
                <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                  When you pick your seats, they lock exclusively to your session for 10 minutes with live countdown timers and instant WebSocket updates across all viewers.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 prime-card h-100 d-flex flex-column">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ width: '56px', height: '56px', backgroundColor: 'rgba(0, 200, 83, 0.15)', color: '#00c853', fontSize: '1.5rem' }}
                >
                  <FontAwesomeIcon icon={faTicket} />
                </div>
                <h5 className="fw-bold text-white mb-2">QR Passes & WhatsApp Share</h5>
                <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                  Receive verified digital tickets featuring scannable QR codes, printable summaries, calendar reminders, and one-tap WhatsApp sharing with friends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Helper Banner */}
      <section className="py-4 border-top border-bottom border-secondary border-opacity-25" style={{ backgroundColor: '#0f171e' }}>
        <div className="container">
          <div className="row align-items-center justify-content-between g-3">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <span className="badge px-3 py-2 fw-bold" style={{ backgroundColor: 'rgba(0, 168, 225, 0.2)', color: '#00a8e1' }}>
                  EVALUATOR SHORTCUTS
                </span>
                <span className="text-white small">
                  Test the complete end-to-end reservation and administration flows instantly:
                </span>
              </div>
            </div>
            <div className="col-md-4 d-flex justify-content-md-end gap-2">
              <button
                onClick={() => handleQuickDemoLogin('user')}
                className="btn btn-prime btn-sm px-3 py-2"
              >
                Log In as User
              </button>
              <button
                onClick={() => handleQuickDemoLogin('admin')}
                className="btn btn-prime-outline btn-sm px-3 py-2"
              >
                Log In as Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

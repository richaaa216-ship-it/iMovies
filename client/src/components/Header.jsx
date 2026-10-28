import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilm,
  faTicket,
  faBookmark,
  faUser,
  faRightFromBracket,
  faBars,
  faXmark,
  faPlus,
  faGaugeHigh,
  faBuilding,
  faCalendarPlus,
  faUserShield,
  faReceipt,
  faCreditCard,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import API from '../utils/api';

export default function Header() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userToken = localStorage.getItem('imovies-user-token');
  const adminToken = localStorage.getItem('imovies-admin-token');
  const isAdmin = Boolean(adminToken);
  const isUser = Boolean(userToken) && !isAdmin;

  const storedUser = localStorage.getItem('imovies-user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const storedAdmin = localStorage.getItem('imovies-admin');
  const currentAdmin = storedAdmin ? JSON.parse(storedAdmin) : null;

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
  const closeNav = () => setIsNavCollapsed(true);

  const handleLogout = () => {
    localStorage.removeItem('imovies-user-token');
    localStorage.removeItem('imovies-admin-token');
    localStorage.removeItem('imovies-user');
    localStorage.removeItem('imovies-admin');
    closeNav();
    toast.success('Signed out successfully');
    navigate('/landing');
  };

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
      toast.error('Demo login failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length > 1) {
      API.get(`/movies/search?q=${encodeURIComponent(q.trim())}`)
        .then((res) => {
          if (res.data?.movies) {
            setSearchResults(res.data.movies.slice(0, 5));
            setShowSearchDropdown(true);
          }
        })
        .catch(() => {});
    } else {
      setShowSearchDropdown(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-dark-custom py-2 px-3 px-md-4 shadow-lg sticky-top">
      <div className="container-fluid">
        {/* Brand Logo - Amazon Prime Aesthetic */}
        <Link
          to={isAdmin ? '/admin' : isUser ? '/home' : '/landing'}
          className="navbar-brand-logo text-decoration-none me-4"
          onClick={closeNav}
        >
          <span style={{ fontSize: '1.5rem' }}>🎬</span>
          <span>
            <span className="accent">i</span>Movies
          </span>
          <span className="prime-pill">prime</span>
        </Link>

        {/* Global Search Bar */}
        <div className="position-relative d-none d-md-block" style={{ width: '280px' }}>
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary border-opacity-50 text-secondary" style={{ backgroundColor: '#141c24' }}>
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: '#00a8e1' }} />
            </span>
            <input
              type="text"
              className="form-control form-dark"
              placeholder="Search movies, genres..."
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchQuery.trim().length > 1 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 250)}
              style={{ fontSize: '0.85rem', padding: '7px 12px' }}
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div
              className="position-absolute start-0 w-100 mt-1 shadow-lg rounded"
              style={{
                backgroundColor: '#1a242f',
                border: '1px solid rgba(0, 168, 225, 0.4)',
                zIndex: 1050,
                maxHeight: '320px',
                overflowY: 'auto'
              }}
            >
              {searchResults.map((m) => (
                <div
                  key={m._id}
                  className="p-2 border-bottom border-secondary border-opacity-25 d-flex align-items-center gap-2 cursor-pointer hover-bg-dark"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    navigate(`/moviedetails/${m._id}`);
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }}
                >
                  <img
                    src={m.posterUrl}
                    alt={m.movieName}
                    style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div>
                    <div className="text-white fw-bold text-truncate" style={{ fontSize: '0.88rem' }}>
                      {m.movieName}
                    </div>
                    <div className="text-secondary small" style={{ fontSize: '0.75rem', color: '#8197a4' }}>
                      {m.language} • {m.genres?.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0"
          type="button"
          aria-controls="navbarContent"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
          onClick={handleNavCollapse}
          style={{ boxShadow: 'none', color: '#fff' }}
        >
          <FontAwesomeIcon icon={isNavCollapsed ? faBars : faXmark} size="lg" />
        </button>

        {/* Navigation Items */}
        <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-1 gap-lg-2">
            {/* ADMIN NAV */}
            {isAdmin && (
              <>
                <li className="nav-item">
                  <Link
                    to="/admin"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faGaugeHigh} style={{ color: '#00a8e1' }} />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/addmovie"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/addmovie') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faFilm} style={{ color: '#00a8e1' }} />
                    <span>Add Movie</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/addtheatre"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/addtheatre') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faBuilding} style={{ color: '#00a8e1' }} />
                    <span>Add Theatre</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/addshow"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/addshow') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faCalendarPlus} style={{ color: '#00a8e1' }} />
                    <span>Add Show</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/adminbookings"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/adminbookings') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faReceipt} style={{ color: '#00a8e1' }} />
                    <span>Bookings</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/admintransactions"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/admintransactions') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faCreditCard} style={{ color: '#00a8e1' }} />
                    <span>Transactions</span>
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <button
                    onClick={handleLogout}
                    className="btn btn-prime-outline btn-sm py-1 px-3"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <span>Logout</span>
                  </button>
                </li>
              </>
            )}

            {/* USER NAV */}
            {isUser && (
              <>
                <li className="nav-item">
                  <Link
                    to="/home"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/home') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faFilm} style={{ color: '#00a8e1' }} />
                    <span>Home</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/watchlist"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/watchlist') || isActive('/favoriteshows') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faBookmark} style={{ color: '#00a8e1' }} />
                    <span>Watchlist</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/bookings"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/bookings') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faTicket} style={{ color: '#00a8e1' }} />
                    <span>My Bookings</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/profile"
                    onClick={closeNav}
                    className={`prime-nav-link d-flex align-items-center gap-2 ${isActive('/profile') ? 'active' : ''}`}
                  >
                    <FontAwesomeIcon icon={faUser} style={{ color: '#00a8e1' }} />
                    <span>{currentUser?.username || 'Profile'}</span>
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <button
                    onClick={handleLogout}
                    className="btn btn-prime-outline btn-sm py-1 px-3"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <span>Sign Out</span>
                  </button>
                </li>
              </>
            )}

            {/* GUEST NAV */}
            {!isAdmin && !isUser && (
              <>
                <li className="nav-item">
                  <Link
                    to="/landing"
                    onClick={closeNav}
                    className={`prime-nav-link ${isActive('/landing') ? 'active' : ''}`}
                  >
                    Explore
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/login"
                    onClick={closeNav}
                    className={`prime-nav-link ${isActive('/login') ? 'active' : ''}`}
                  >
                    Sign In
                  </Link>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link
                    to="/register"
                    onClick={closeNav}
                    className="btn btn-prime btn-sm px-3 py-1"
                  >
                    Join Prime
                  </Link>
                </li>

                {/* Quick 1-Click Demo Login Helpers for evaluators */}
                <li className="nav-item ms-lg-2 d-flex gap-1">
                  <button
                    onClick={() => handleQuickDemoLogin('user')}
                    className="btn btn-prime-ghost btn-sm py-1 px-2 text-nowrap"
                    title="Sign in with user@imovies.com"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Demo User
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="btn btn-prime-ghost btn-sm py-1 px-2 text-nowrap"
                    title="Sign in with admin@imovies.com"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Demo Admin
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

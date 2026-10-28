import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faTicket, faStar, faBookmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import API from '../utils/api';

export default function MovieCard({ movie, onWatchlistChange }) {
  const navigate = useNavigate();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  if (!movie) return null;

  const id = movie._id || movie.id;
  const title = movie.movieName || movie.name || movie.title || 'Untitled Movie';
  const poster =
    movie.posterUrl ||
    movie.poster ||
    movie.image ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
  const certification = movie.certification || movie.cert || 'U/A 16+';
  const language =
    movie.language ||
    (Array.isArray(movie.languages) ? movie.languages.join(', ') : 'English');

  let genres = [];
  if (Array.isArray(movie.genres)) {
    genres = movie.genres;
  } else if (Array.isArray(movie.genre)) {
    genres = movie.genre;
  } else if (typeof movie.genre === 'string') {
    genres = movie.genre.split(',').map((g) => g.trim());
  } else if (typeof movie.genres === 'string') {
    genres = movie.genres.split(',').map((g) => g.trim());
  }

  const formatDuration = (val) => {
    if (!val) return '2h 15m';
    if (typeof val === 'number') {
      const hours = Math.floor(val / 60);
      const mins = val % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    return val;
  };

  const handleCardClick = () => {
    if (id) navigate(`/moviedetails/${id}`);
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (id) navigate(`/movieshows/${id}`);
  };

  const handleWatchlistToggle = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('imovies-user-token');
    if (!token) {
      toast.info('Please sign in to save movies to your Prime Watchlist');
      navigate('/login');
      return;
    }

    setBookmarkLoading(true);
    try {
      const res = await API.post('/favorites/toggle', { movieId: id });
      if (res.data && res.data.success) {
        const added = res.data.favorited || res.data.isFavorite;
        setIsInWatchlist(added);
        toast.success(added ? `Added "${title}" to Watchlist` : `Removed from Watchlist`);
        if (onWatchlistChange) onWatchlistChange(id, added);
      }
    } catch (err) {
      // Fallback local toggle
      setIsInWatchlist(!isInWatchlist);
      toast.success(!isInWatchlist ? `Saved to Watchlist` : `Removed from Watchlist`);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const ratingVal = movie.rating || movie.vote_average || 8.4;

  return (
    <div
      className="prime-movie-card h-100 d-flex flex-column position-relative"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Poster Image Container */}
      <div className="position-relative overflow-hidden" style={{ height: '300px' }}>
        <img
          src={poster}
          alt={title}
          className="w-100 h-100"
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
          }}
        />

        {/* Top Badges */}
        <div className="position-absolute top-0 start-0 m-2 d-flex gap-1 align-items-center" style={{ zIndex: 2 }}>
          <span className="prime-badge">PRIME</span>
          <span className="cert-badge">{certification}</span>
        </div>

        {/* Watchlist Bookmark Icon Button top-right */}
        <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 3 }}>
          <button
            onClick={handleWatchlistToggle}
            className="btn btn-sm d-flex align-items-center justify-content-center border-0 rounded-circle"
            title={isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: isInWatchlist ? 'var(--prime-blue)' : 'rgba(15, 23, 30, 0.75)',
              color: isInWatchlist ? '#0f171e' : '#ffffff',
              backdropFilter: 'blur(6px)'
            }}
          >
            <FontAwesomeIcon icon={isInWatchlist ? faCheck : faBookmark} style={{ fontSize: '0.8rem' }} />
          </button>
        </div>

        {/* IMDb Rating Badge bottom-left */}
        <div className="position-absolute bottom-0 start-0 m-2" style={{ zIndex: 2 }}>
          <span className="imdb-badge">
            <FontAwesomeIcon icon={faStar} />
            <span>{Number(ratingVal).toFixed(1)}</span>
          </span>
        </div>

        {/* Language Badge bottom-right */}
        <div className="position-absolute bottom-0 end-0 m-2" style={{ zIndex: 2 }}>
          <span
            className="badge fw-semibold"
            style={{ background: 'rgba(15, 23, 30, 0.85)', color: '#00a8e1', border: '1px solid rgba(0, 168, 225, 0.4)', fontSize: '0.68rem' }}
          >
            {language}
          </span>
        </div>

        {/* Hover overlay with Book Now CTA */}
        <div
          className="book-overlay position-absolute bottom-0 start-0 w-100 px-3 pb-3 pt-5"
          style={{ zIndex: 4 }}
        >
          <button
            className="btn btn-prime btn-sm w-100 fw-bold"
            onClick={handleBookClick}
            style={{ fontSize: '0.85rem' }}
          >
            <FontAwesomeIcon icon={faTicket} />
            Book Tickets
          </button>
        </div>
      </div>

      {/* Movie Details Footer */}
      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between" style={{ backgroundColor: '#151f28' }}>
        <div>
          <h5
            className="fw-bold mb-1 text-truncate text-white"
            title={title}
            style={{ fontSize: '0.98rem', letterSpacing: '-0.2px' }}
          >
            {title}
          </h5>

          {/* Genres row */}
          <div className="mb-2 d-flex flex-wrap gap-1">
            {genres.slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="genre-badge m-0"
                style={{ fontSize: '0.68rem', padding: '2px 8px' }}
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Meta duration + quick book button */}
        <div className="pt-2 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
          <span className="text-secondary small d-flex align-items-center gap-1" style={{ color: '#8197a4', fontSize: '0.78rem' }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.72rem', color: '#00a8e1' }} />
            <span>{formatDuration(movie.duration)}</span>
          </span>
          <button
            className="btn btn-prime-outline btn-sm py-1 px-3 fw-bold"
            style={{ fontSize: '0.75rem', borderRadius: '4px' }}
            onClick={handleBookClick}
          >
            Shows
          </button>
        </div>
      </div>
    </div>
  );
}

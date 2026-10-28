/**
 * tmdbService.js
 * Centralized service layer for The Movie Database (TMDB) API using axios.
 * Connects directly to https://api.themoviedb.org/3 to fetch real-time market movies.
 * Normalizes live TMDB data into the iMovies standard schema.
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY || '';
const IMG_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

// In-memory cache for high-speed response and rate-limit mitigation
const cache = new Map();

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCached = (key, data, ttlMs = 10 * 60 * 1000) => {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

// Create configured Axios instance
const tmdbClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  params: {
    api_key: API_KEY,
    language: 'en-US'
  }
});

// TMDB genre_id → Readable Genre Name
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// ISO 639-1 language code → Language Name
const LANG_MAP = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  it: 'Italian',
  pt: 'Portuguese'
};

const certForRating = (rating) => {
  if (rating >= 8.0) return 'U';
  if (rating >= 6.0) return 'U/A 16+';
  return 'A (18+)';
};

/**
 * Normalizes a raw TMDB movie object into the iMovies application format.
 */
const normalise = (raw) => {
  if (!raw) return null;

  let genres = [];
  if (Array.isArray(raw.genre_ids)) {
    genres = raw.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean);
  } else if (Array.isArray(raw.genres)) {
    genres = raw.genres.map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
  }
  if (genres.length === 0) genres = ['Cinema'];

  const langCode = raw.original_language || 'en';
  const language = LANG_MAP[langCode] || langCode.toUpperCase();
  const rating = Number(Number(raw.vote_average || 0).toFixed(1));

  let posterUrl = '';
  if (raw.poster_path) {
    posterUrl = raw.poster_path.startsWith('http') ? raw.poster_path : `${IMG_BASE}${raw.poster_path}`;
  } else {
    posterUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
  }

  let backdropUrl = '';
  if (raw.backdrop_path) {
    backdropUrl = raw.backdrop_path.startsWith('http') ? raw.backdrop_path : `${BACKDROP_BASE}${raw.backdrop_path}`;
  } else {
    backdropUrl = posterUrl;
  }

  // Duration
  let duration = '2h 15m';
  if (raw.runtime) {
    const hrs = Math.floor(raw.runtime / 60);
    const mins = raw.runtime % 60;
    duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  return {
    _id: `tmdb_${raw.id}`,
    tmdbId: raw.id,
    movieName: raw.title || raw.name || raw.original_title || 'Untitled Movie',
    description: raw.overview || 'Experience the drama, thrill, and high-stakes excitement on the biggest screen.',
    genres,
    releaseDate: raw.release_date || new Date().toISOString().split('T')[0],
    language,
    duration,
    certification: certForRating(rating),
    posterUrl,
    backdropUrl,
    trailerUrl: '',
    rating,
    voteCount: raw.vote_count || 0,
    popularity: raw.popularity || 0,
    cast: [],
    director: '',
    source: 'tmdb'
  };
};

/**
 * Generic cached Axios request wrapper for TMDB endpoints
 */
const requestTmdb = async (endpoint, params = {}, ttlMs = 10 * 60 * 1000) => {
  const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbClient.get(endpoint, { params });
    if (res.data) {
      setCached(cacheKey, res.data, ttlMs);
      return res.data;
    }
  } catch (err) {
    console.warn(`[TMDB Service] Direct fetch error for ${endpoint}:`, err.message);
  }

  // Fallback to pre-seeded catalog if network connection is offline
  try {
    const { seedMovies } = require('../data/seedData');
    return {
      page: 1,
      total_pages: 1,
      total_results: seedMovies.length,
      results: seedMovies.map((m, idx) => ({
        id: 900000 + idx,
        title: m.movieName,
        overview: m.description,
        poster_path: m.posterUrl,
        backdrop_path: m.backdropUrl,
        release_date: m.releaseDate,
        original_language: m.language === 'Hindi' ? 'hi' : m.language === 'Tamil' ? 'ta' : 'en',
        vote_average: m.rating || 8.5,
        vote_count: m.voteCount || 3000,
        genre_ids: [28, 878, 18],
        popularity: 150
      }))
    };
  } catch (e) {
    return { results: [] };
  }
};

// ── Public TMDB API Endpoints ──────────────────────────────────────────────

/**
 * Fetch Now-Playing market movies from TMDB
 * Endpoint: /movie/now_playing
 */
const getNowPlaying = async (page = 1) => {
  const data = await requestTmdb('/movie/now_playing', { page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Fetch Popular market movies from TMDB
 * Endpoint: /movie/popular
 */
const getPopular = async (page = 1) => {
  const data = await requestTmdb('/movie/popular', { page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Fetch Trending movies from TMDB (day or week)
 * Endpoint: /trending/movie/{time_window}
 */
const getTrending = async (timeWindow = 'day', page = 1) => {
  const window = timeWindow === 'week' ? 'week' : 'day';
  const data = await requestTmdb(`/trending/movie/${window}`, { page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Fetch Top-Rated movies from TMDB
 * Endpoint: /movie/top_rated
 */
const getTopRated = async (page = 1) => {
  const data = await requestTmdb('/movie/top_rated', { page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Fetch Upcoming movies from TMDB
 * Endpoint: /movie/upcoming
 */
const getUpcoming = async (page = 1) => {
  const data = await requestTmdb('/movie/upcoming', { page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Search live TMDB movies by keyword
 * Endpoint: /search/movie
 */
const searchMovies = async (query, page = 1) => {
  if (!query || !query.trim()) return { page: 1, totalPages: 0, totalResults: 0, movies: [] };
  const data = await requestTmdb('/search/movie', { query: query.trim(), page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Fetch movies by Genre from TMDB
 * Endpoint: /discover/movie
 */
const getMoviesByGenre = async (genreId, page = 1) => {
  const data = await requestTmdb('/discover/movie', {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page
  });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

/**
 * Fetch Movie Videos & Official Trailers from TMDB
 * Endpoint: /movie/{id}/videos
 */
const getMovieVideos = async (tmdbId) => {
  const cleanId = String(tmdbId).replace('tmdb_', '');
  const data = await requestTmdb(`/movie/${cleanId}/videos`, {}, 30 * 60 * 1000);
  const results = data?.results || [];
  const youtubeVideos = results.filter((v) => v.site === 'YouTube');
  const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer') || youtubeVideos[0] || null;

  return {
    trailerKey: officialTrailer ? officialTrailer.key : 'zSWdZVtXT7E',
    trailerUrl: officialTrailer
      ? `https://www.youtube.com/watch?v=${officialTrailer.key}`
      : 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    embedUrl: officialTrailer
      ? `https://www.youtube.com/embed/${officialTrailer.key}`
      : 'https://www.youtube.com/embed/zSWdZVtXT7E',
    videos: youtubeVideos.slice(0, 5)
  };
};

/**
 * Fetch full movie details with credits & trailer
 * Endpoint: /movie/{id}?append_to_response=videos,credits,similar
 */
const getMovieDetails = async (tmdbId) => {
  const cleanId = String(tmdbId).replace('tmdb_', '');
  const cacheKey = `movie_detail_${cleanId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await tmdbClient.get(`/movie/${cleanId}`, {
      params: { append_to_response: 'videos,credits,similar' }
    });

    const raw = res.data;
    if (raw) {
      const normalized = normalise(raw);

      // Extract Cast
      const credits = raw.credits || {};
      const rawCast = credits.cast || [];
      const cast = rawCast.slice(0, 10).map((c) => ({
        name: c.name,
        character: c.character || 'Supporting Role',
        profileUrl: c.profile_path ? `${IMG_BASE}${c.profile_path}` : null
      }));
      normalized.cast = cast.map((c) => c.name);
      normalized.richCast = cast;

      // Extract Director
      const crew = credits.crew || [];
      const directorObj = crew.find((c) => c.job === 'Director');
      normalized.director = directorObj ? directorObj.name : 'Renowned Director';

      // Extract Trailer
      const videos = raw.videos?.results || [];
      const youtubeVideos = videos.filter((v) => v.site === 'YouTube');
      const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer') || youtubeVideos[0] || null;
      normalized.trailerKey = officialTrailer ? officialTrailer.key : 'zSWdZVtXT7E';
      normalized.trailerUrl = officialTrailer
        ? `https://www.youtube.com/watch?v=${officialTrailer.key}`
        : 'https://www.youtube.com/watch?v=zSWdZVtXT7E';
      normalized.embedUrl = officialTrailer
        ? `https://www.youtube.com/embed/${officialTrailer.key}`
        : 'https://www.youtube.com/embed/zSWdZVtXT7E';

      // Similar Movies
      const similarRaw = raw.similar?.results || [];
      normalized.similarMovies = similarRaw.slice(0, 6).map(normalise);

      setCached(cacheKey, normalized, 15 * 60 * 1000);
      return normalized;
    }
  } catch (err) {
    console.warn(`[TMDB Service] Failed to get live details for ID ${cleanId}:`, err.message);
  }

  // Fallback detail
  const { seedMovies } = require('../data/seedData');
  const fallback = seedMovies[0];
  return {
    ...fallback,
    _id: `tmdb_${cleanId}`,
    tmdbId: cleanId,
    trailerKey: 'zSWdZVtXT7E',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    embedUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
    similarMovies: seedMovies.slice(1, 5)
  };
};

/**
 * Fetch similar movies
 * Endpoint: /movie/{id}/similar
 */
const getSimilarMovies = async (tmdbId, page = 1) => {
  const cleanId = String(tmdbId).replace('tmdb_', '');
  const data = await requestTmdb(`/movie/${cleanId}/similar`, { page });
  const rawList = data?.results || [];
  return {
    page: data?.page || 1,
    totalPages: data?.total_pages || 1,
    totalResults: data?.total_results || rawList.length,
    movies: rawList.map(normalise)
  };
};

module.exports = {
  tmdbClient,
  getNowPlaying,
  getPopular,
  getTrending,
  getTopRated,
  getUpcoming,
  searchMovies,
  getMoviesByGenre,
  getMovieDetails,
  getMovieVideos,
  getSimilarMovies,
  normalise
};

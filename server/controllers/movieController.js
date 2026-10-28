const mongoose = require('mongoose');
const Movie = require('../models/movieModel');
const tmdb = require('../services/tmdbService');

// ─── TMDB Live Controllers ────────────────────────────────────────────────────

/**
 * GET /api/movies/tmdb/nowplaying?page=1
 * Fetches real-time now-playing market movies from TMDB
 */
const tmdbNowPlaying = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getNowPlaying(page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbNowPlaying error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch now-playing movies from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/popular?page=1
 * Fetches real-time popular market movies from TMDB
 */
const tmdbPopular = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getPopular(page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbPopular error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch popular movies from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/toprated?page=1
 */
const tmdbTopRated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getTopRated(page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbTopRated error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch top-rated movies from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/upcoming?page=1
 */
const tmdbUpcoming = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getUpcoming(page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbUpcoming error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch upcoming movies from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/search?q=avengers
 * Live TMDB search
 */
const tmdbSearchMovies = async (req, res) => {
  try {
    const query = (req.query.q || req.query.query || '').trim();
    if (!query) return res.status(400).json({ success: false, error: 'Search query is required', movies: [] });
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.searchMovies(query, page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbSearchMovies error:', err.message);
    return res.status(502).json({ success: false, error: 'TMDB search failed', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/:tmdbId
 * Full detail with cast, director, and trailer
 */
const tmdbGetMovieById = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const movie = await tmdb.getMovieDetails(tmdbId);
    return res.status(200).json({ success: true, movie });
  } catch (err) {
    console.error('tmdbGetMovieById error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch movie details from TMDB' });
  }
};

/**
 * GET /api/movies/tmdb/trending?timeWindow=day
 */
const tmdbTrending = async (req, res) => {
  try {
    const timeWindow = req.query.timeWindow === 'week' ? 'week' : 'day';
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getTrending(timeWindow, page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbTrending error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch trending movies from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/genre/:genreId
 */
const tmdbMoviesByGenre = async (req, res) => {
  try {
    const { genreId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getMoviesByGenre(genreId, page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbMoviesByGenre error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch movies by genre from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/:tmdbId/similar
 */
const tmdbSimilarMovies = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const result = await tmdb.getSimilarMovies(tmdbId, page);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbSimilarMovies error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch similar movies from TMDB', movies: [] });
  }
};

/**
 * GET /api/movies/tmdb/:tmdbId/trailer
 */
const tmdbMovieTrailer = async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const result = await tmdb.getMovieVideos(tmdbId);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('tmdbMovieTrailer error:', err.message);
    return res.status(502).json({ success: false, error: 'Failed to fetch movie trailer from TMDB' });
  }
};

// ─── Standard / Blended Movie Routes ─────────────────────────────────────────

/**
 * GET /api/movies
 * Returns live market movies from TMDB (/movie/now_playing or /movie/popular)
 * combined with any custom movies added by admins
 */
const getAllMovies = async (req, res) => {
  try {
    const type = req.query.type || 'now_playing';
    const page = parseInt(req.query.page) || 1;

    // Fetch live market movies from TMDB
    let tmdbData;
    if (type === 'popular') {
      tmdbData = await tmdb.getPopular(page);
    } else if (type === 'top_rated') {
      tmdbData = await tmdb.getTopRated(page);
    } else if (type === 'upcoming') {
      tmdbData = await tmdb.getUpcoming(page);
    } else {
      tmdbData = await tmdb.getNowPlaying(page);
    }

    const liveMovies = tmdbData.movies || [];

    // Also include any custom database movies
    let localMovies = [];
    try {
      localMovies = await Movie.find({}).sort({ releaseDate: -1 });
    } catch (e) {
      // non-blocking
    }

    // Merge: custom movies first, then live market movies
    const combined = [...localMovies, ...liveMovies];

    return res.status(200).json({
      success: true,
      count: combined.length,
      movies: combined,
      page: tmdbData.page || 1,
      totalPages: tmdbData.totalPages || 1
    });
  } catch (error) {
    console.error('Error in getAllMovies:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch movies'
    });
  }
};

/**
 * GET /api/movies/:id
 * Fetches single movie by MongoDB ObjectId or TMDB virtual ID (tmdb_*)
 */
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    // Handle TMDB IDs (e.g. tmdb_12345 or pure numeric string)
    if (id && (id.startsWith('tmdb_') || /^\d+$/.test(id))) {
      const cleanId = id.replace('tmdb_', '');
      const movie = await tmdb.getMovieDetails(cleanId);
      if (movie) {
        return res.status(200).json({ success: true, movie });
      }
    }

    // Handle MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      const movie = await Movie.findById(id);
      if (movie) {
        return res.status(200).json({ success: true, movie });
      }
    }

    // Fallback: try TMDB details
    const movie = await tmdb.getMovieDetails(id);
    if (movie) {
      return res.status(200).json({ success: true, movie });
    }

    return res.status(404).json({
      success: false,
      error: 'Movie not found'
    });
  } catch (error) {
    console.error('Error in getMovieById:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch movie'
    });
  }
};

/**
 * POST /api/movies
 * Add a new movie (Admin authenticated)
 */
const addMovie = async (req, res) => {
  try {
    const {
      movieName,
      description,
      genres,
      releaseDate,
      language,
      duration,
      certification,
      posterUrl,
      trailerUrl,
      cast,
      director
    } = req.body;

    if (!movieName || !description || !genres || !releaseDate || !language || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    const newMovie = new Movie({
      movieName: movieName.trim(),
      description: description.trim(),
      genres: Array.isArray(genres) ? genres : genres.split(',').map((g) => g.trim()),
      releaseDate: new Date(releaseDate),
      language: language.trim(),
      duration,
      certification: certification ? certification.trim() : 'U',
      posterUrl: posterUrl ? posterUrl.trim() : '',
      trailerUrl: trailerUrl ? trailerUrl.trim() : '',
      cast: Array.isArray(cast) ? cast : cast ? cast.split(',').map((c) => c.trim()) : [],
      director: director ? director.trim() : ''
    });

    const savedMovie = await newMovie.save();

    return res.status(201).json({
      success: true,
      message: 'Movie added successfully',
      movie: savedMovie
    });
  } catch (error) {
    console.error('Error in addMovie:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to add movie'
    });
  }
};

/**
 * PUT /api/movies/:id
 */
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
    if (!updatedMovie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      movie: updatedMovie
    });
  } catch (error) {
    console.error('Error in updateMovie:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update movie'
    });
  }
};

/**
 * DELETE /api/movies/:id
 */
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    const deletedMovie = await Movie.findByIdAndDelete(id);
    if (!deletedMovie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Movie deleted successfully',
      movie: deletedMovie
    });
  } catch (error) {
    console.error('Error in deleteMovie:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete movie'
    });
  }
};

/**
 * GET /api/movies/search?q=name
 * Searches TMDB live market movies and local catalog
 */
const searchMovies = async (req, res) => {
  try {
    const query = (req.query.q || req.query.query || '').trim();
    if (!query) {
      return res.status(200).json({ success: true, count: 0, movies: [] });
    }

    // Query TMDB live search
    const tmdbResults = await tmdb.searchMovies(query);
    const liveMatches = tmdbResults.movies || [];

    // Also search local DB
    let localMatches = [];
    try {
      const searchRegex = new RegExp(query, 'i');
      localMatches = await Movie.find({ movieName: { $regex: searchRegex } });
    } catch (e) {
      // non-blocking
    }

    const combined = [...localMatches, ...liveMatches];

    return res.status(200).json({
      success: true,
      count: combined.length,
      movies: combined
    });
  } catch (error) {
    console.error('Error in searchMovies:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search movies'
    });
  }
};

/**
 * GET /api/movies/filter?genre=Action&language=English
 */
const filterMovies = async (req, res) => {
  try {
    const { genre, language } = req.query;

    // Fetch live now playing and filter
    const nowPlayingData = await tmdb.getNowPlaying(1);
    let movies = nowPlayingData.movies || [];

    if (genre && genre !== 'all') {
      movies = movies.filter((m) =>
        (m.genres || []).some((g) => g.toLowerCase() === genre.toLowerCase())
      );
    }

    if (language && language !== 'All Languages') {
      movies = movies.filter((m) =>
        (m.language || '').toLowerCase() === language.toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      count: movies.length,
      movies
    });
  } catch (error) {
    console.error('Error in filterMovies:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to filter movies'
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
  searchMovies,
  filterMovies,
  // TMDB live data
  tmdbNowPlaying,
  tmdbPopular,
  tmdbTopRated,
  tmdbUpcoming,
  tmdbSearchMovies,
  tmdbGetMovieById,
  tmdbTrending,
  tmdbMoviesByGenre,
  tmdbSimilarMovies,
  tmdbMovieTrailer
};

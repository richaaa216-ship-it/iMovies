const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  toggleFavorite
} = require('../controllers/favoriteController');
const fetchUser = require('../middlewares/fetchUser');

router.post('/', fetchUser, addFavorite);
router.post('/toggle', fetchUser, toggleFavorite);
router.delete('/:movieId', fetchUser, removeFavorite);
router.get('/', fetchUser, getUserFavorites);

module.exports = router;

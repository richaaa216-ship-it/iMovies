const mongoose = require('mongoose');
const { getModel } = require('../config/dbAdapter');

const favoriteSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  movieId: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

favoriteSchema.index({ userEmail: 1, movieId: 1 }, { unique: true });

const MongooseFavorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
module.exports = getModel('Favorite', MongooseFavorite);

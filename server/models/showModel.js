const mongoose = require('mongoose');
const { getModel } = require('../config/dbAdapter');

const showSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  showId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  movieId: {
    type: String,
    required: true,
    trim: true
  },
  movieName: {
    type: String,
    trim: true,
    default: ''
  },
  theatreId: {
    type: String,
    required: true,
    trim: true
  },
  theatreName: {
    type: String,
    required: true,
    trim: true
  },
  screenName: {
    type: String,
    trim: true,
    default: 'Audi 1'
  },
  showDate: {
    type: String,
    required: true,
    trim: true
  },
  showTime: {
    type: String,
    required: true,
    trim: true
  },
  tickets: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

showSchema.index({ movieId: 1, showDate: 1, theatreId: 1 });
showSchema.index({ theatreId: 1, showDate: 1, showTime: 1 });

const MongooseShow = mongoose.models.Show || mongoose.model('Show', showSchema);
module.exports = getModel('Show', MongooseShow);

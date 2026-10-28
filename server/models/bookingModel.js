const mongoose = require('mongoose');
const { getModel } = require('../config/dbAdapter');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  showId: {
    type: String,
    required: true,
    trim: true
  },
  movieId: {
    type: String,
    trim: true
  },
  movieName: {
    type: String,
    trim: true
  },
  posterUrl: {
    type: String,
    trim: true,
    default: ''
  },
  theatreId: {
    type: String,
    trim: true,
    default: ''
  },
  theatreName: {
    type: String,
    trim: true
  },
  showDate: {
    type: String,
    trim: true
  },
  showTime: {
    type: String,
    trim: true
  },
  ticketsData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  selectedSeats: {
    type: [String],
    default: []
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    default: 'Direct Payment'
  },
  transactionId: {
    type: String,
    trim: true,
    default: ''
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: ''
  },
  razorpaySignature: {
    type: String,
    trim: true,
    default: ''
  },
  refundId: {
    type: String,
    trim: true,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

const MongooseBooking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
module.exports = getModel('Booking', MongooseBooking);

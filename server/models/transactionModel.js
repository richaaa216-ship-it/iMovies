const mongoose = require('mongoose');
const { getModel } = require('../config/dbAdapter');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    userId: {
      type: String,
      required: true,
      trim: true
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    userName: {
      type: String,
      trim: true,
      default: ''
    },
    bookingId: {
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
    showtimeId: {
      type: String,
      trim: true
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
    seats: {
      type: [String],
      required: true,
      default: []
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Direct Payment / Cash / Mock UPI'
    },
    paymentStatus: {
      type: String,
      enum: ['Success', 'Completed', 'Refunded', 'Failed'],
      default: 'Completed'
    },
    receiptNumber: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const MongooseTransaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const Transaction = getModel('Transaction', MongooseTransaction);

module.exports = Transaction;

const mongoose = require('mongoose');
const { getModel } = require('../config/dbAdapter');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 20,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

const MongooseAdmin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
module.exports = getModel('Admin', MongooseAdmin);

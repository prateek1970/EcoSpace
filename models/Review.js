const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);

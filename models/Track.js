const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Track title is required'],
    trim: true
  },
  artistName: {
    type: String,
    default: 'Solo Artist',
    trim: true
  },
  category: {
    type: String,
    enum: ['Acoustic Cover', 'Original Song', 'Jam Session', 'Festival Snippet'],
    default: 'Acoustic Cover'
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio URL is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Track', trackSchema);

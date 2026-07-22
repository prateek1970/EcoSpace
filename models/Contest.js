const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  favoriteArtist: { type: String, required: true },
  reason: { type: String, required: true },
  isWinner: { type: Boolean, default: false },
  prize: { type: String, default: 'Pending Selection' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', contestSchema);

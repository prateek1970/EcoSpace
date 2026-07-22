const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emailOrPhone: { type: String, required: true },
  favoriteArtist: { type: String, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', contestSchema);

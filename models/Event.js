const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  artistName: { type: String, required: true },
  stage: { type: String, default: 'Main Stage' },
  date: { type: String, required: true }, // e.g., "2026-07-27" or "27 July 2026"
  startTime: { type: String, default: '18:00' },
  endTime: { type: String, default: '22:00' },
  totalCapacity: { type: Number, default: 50000 },
  availableSeats: { type: Number, default: 50000 },
  status: { type: String, enum: ['UPCOMING', 'LIVE', 'COMPLETED'], default: 'UPCOMING' },
  imageUrl: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);

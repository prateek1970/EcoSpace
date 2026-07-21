const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index: auto-delete when expired
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index so we can look up by identifier + type quickly
otpSchema.index({ identifier: 1, type: 1 });

module.exports = mongoose.model('Otp', otpSchema);

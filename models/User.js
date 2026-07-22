const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  emailOrPhone: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: 'Creator' },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

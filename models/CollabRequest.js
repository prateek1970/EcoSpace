const mongoose = require('mongoose');

const collabRequestSchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true
  },
  senderEmail: {
    type: String,
    required: [true, 'Sender email is required'],
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['Vocalist', 'Guitarist', 'Producer', 'Songwriter', 'Special Guest'],
    required: [true, 'Role selection is required']
  },
  projectType: {
    type: String,
    required: [true, 'Project type is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Review', 'Accepted', 'Closed'],
    default: 'Open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CollabRequest', collabRequestSchema);

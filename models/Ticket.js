const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, required: true },
  userContact: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  artistName: { type: String, required: true },
  eventDate: { type: String, required: true },
  tier: { type: String, enum: ['GA', 'VIP'], required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  partnerPlatform: { type: String, enum: ['BookMyShow', 'District', 'Sort My Scene', 'SortMyScene', 'Ticket9'], default: 'BookMyShow' },
  upiTxnRef: { type: String, default: null },
  paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  qrCodeUrl: { type: String },
  upiDeepLink: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);

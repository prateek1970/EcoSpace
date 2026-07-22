const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  userEmailOrPhone: { type: String, required: true },
  artistName: { type: String, required: true },
  eventDate: { type: String, required: true },
  tier: { type: String, enum: ['GA', 'VIP'], required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number, required: true },
  partnerPlatform: { type: String, enum: ['BookMyShow', 'District', 'SortMyScene', 'Ticket9'], default: 'BookMyShow' },
  paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
  qrCodeUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);

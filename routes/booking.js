const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Contest = require('../models/Contest');

// 1. Process Booking & Generate E-Ticket
router.post('/api/tickets/book', async (req, res) => {
  try {
    const { userName, userEmailOrPhone, artistName, eventDate, tier, quantity, partnerPlatform } = req.body;

    const unitPrice = tier === 'VIP' ? 15000 : 2000;
    const totalAmount = unitPrice * (parseInt(quantity) || 1);
    
    // Generate unique Booking ID
    const bookingId = 'NICE-' + Math.floor(100000 + Math.random() * 900000);

    const newTicket = new Ticket({
      bookingId,
      userName: userName || 'Music Fan',
      userEmailOrPhone: userEmailOrPhone || 'fan@echospace.live',
      artistName: artistName || 'EchoSpace Artist',
      eventDate: eventDate || '27 July 2026',
      tier: tier === 'VIP' ? 'VIP' : 'GA',
      price: unitPrice,
      quantity: parseInt(quantity) || 1,
      totalAmount,
      partnerPlatform: ['BookMyShow', 'District', 'SortMyScene', 'Ticket9'].includes(partnerPlatform) ? partnerPlatform : 'BookMyShow',
      paymentStatus: 'SUCCESS',
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}`
    });

    await newTicket.save();

    return res.json({
      success: true,
      message: 'Payment Successful! E-Ticket Generated.',
      ticket: newTicket
    });

  } catch (err) {
    console.error('Booking Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate ticket.' });
  }
});

// 2. Submit Contest Entry
router.post('/api/contest/entry', async (req, res) => {
  try {
    const { name, emailOrPhone, favoriteArtist, reason } = req.body;
    
    if (!name || !emailOrPhone || !favoriteArtist || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const entry = new Contest({ name, emailOrPhone, favoriteArtist, reason });
    await entry.save();

    return res.json({
      success: true,
      message: '🎉 You are entered into the Lucky Draw for Meet & Greet passes!'
    });
  } catch (err) {
    console.error('Contest Entry Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit entry.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Contest = require('../models/Contest');

// Helper: sanitize string input
const sanitize = (val) => typeof val === 'string' ? val.trim().slice(0, 200) : '';

// 1. Process Booking & Generate E-Ticket
router.post('/api/tickets/book', async (req, res) => {
  try {
    const {
      userName, userEmailOrPhone, artistName, eventDate,
      tier, quantity, partnerPlatform
    } = req.body;

    // SECURITY: Input validation
    if (!userName || !userEmailOrPhone || !artistName || !tier || !eventDate) {
      return res.status(400).json({ success: false, message: 'All booking fields are required.' });
    }

    const validTiers = ['VIP', 'GA'];
    const safeTier = validTiers.includes(String(tier).toUpperCase()) ? String(tier).toUpperCase() : 'GA';
    const unitPrice = safeTier === 'VIP' ? 15000 : 2000;
    const safeQty = Math.min(Math.max(parseInt(quantity) || 1, 1), 10); // clamp 1–10
    const totalAmount = unitPrice * safeQty;

    const validPlatforms = ['BookMyShow', 'District', 'SortMyScene', 'Ticket9'];
    const safePlatform = validPlatforms.includes(partnerPlatform) ? partnerPlatform : 'BookMyShow';

    // Generate unique Booking ID
    const bookingId = 'NICE-' + Math.floor(100000 + Math.random() * 900000);

    const newTicket = new Ticket({
      bookingId,
      userName: sanitize(userName),
      userEmailOrPhone: sanitize(userEmailOrPhone),
      artistName: sanitize(artistName),
      eventDate: sanitize(eventDate),
      tier: safeTier,
      price: unitPrice,
      quantity: safeQty,
      totalAmount,
      partnerPlatform: safePlatform,
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

// 2. Submit Contest Entry — with duplicate check
router.post('/api/contest/entry', async (req, res) => {
  try {
    const { name, emailOrPhone, favoriteArtist, reason } = req.body;

    // SECURITY: Validate all fields
    if (!name || !emailOrPhone || !favoriteArtist || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const cleanEmail = String(emailOrPhone).trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    const isPhone = /^[0-9]{10,15}$/.test(cleanEmail);
    if (!isEmail && !isPhone) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email or phone number.' });
    }

    // SECURITY: Prevent duplicate entries per person
    const existing = await Contest.findOne({ emailOrPhone: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted an entry.' });
    }

    const entry = new Contest({
      name: sanitize(name),
      emailOrPhone: cleanEmail,
      favoriteArtist: sanitize(favoriteArtist),
      reason: String(reason).trim().slice(0, 1000)
    });
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

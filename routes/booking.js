const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const Contest = require('../models/Contest');

// Helper: sanitize string input
const sanitize = (val) => typeof val === 'string' ? val.trim().slice(0, 200) : '';

// 1. GET /api/events - Real-time schedule & seat availability
router.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1, createdAt: 1 });

    const formattedEvents = events.map(evt => {
      let seatBadge = 'Available';
      if (evt.availableSeats <= 0) {
        seatBadge = 'Sold Out';
      } else if (evt.availableSeats <= 10000) {
        seatBadge = 'Fast Filling';
      }

      return {
        _id: evt._id,
        artistName: evt.artistName,
        stage: evt.stage,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        totalCapacity: evt.totalCapacity,
        availableSeats: evt.availableSeats,
        seatBadge,
        status: evt.status,
        imageUrl: evt.imageUrl,
        description: evt.description
      };
    });

    return res.json({ success: true, events: formattedEvents });
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch event schedule.' });
  }
});

// 1B. POST /api/tickets/book - Direct Booking Endpoint
router.post('/api/tickets/book', async (req, res) => {
  try {
    const { userName, userContact, artistName, eventDate, tier, partnerPlatform } = req.body;

    if (!userName || !userContact) {
      return res.status(400).json({ success: false, message: 'Name and contact are required.' });
    }

    const safeTier = String(tier).toUpperCase() === 'VIP' ? 'VIP' : 'GA';
    const unitPrice = safeTier === 'VIP' ? 15000 : 2000;
    const bookingId = 'NICE-' + Math.floor(100000 + Math.random() * 900000);

    const upiDeepLink = `upi://pay?pa=echospace@upi&pn=EchoSpaceFestival&am=${unitPrice}&cu=INR&tn=Ticket-${bookingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiDeepLink)}`;

    const newTicket = new Ticket({
      bookingId,
      userId: req.session && req.session.userId ? req.session.userId : null,
      userName: sanitize(userName) || 'Music Fan',
      userContact: sanitize(userContact),
      artistName: sanitize(artistName || 'EchoSpace Artist'),
      eventDate: sanitize(eventDate || 'Festival Day'),
      tier: safeTier,
      unitPrice,
      totalAmount: unitPrice,
      partnerPlatform: partnerPlatform || 'BookMyShow',
      upiDeepLink,
      qrCodeUrl,
      paymentStatus: 'SUCCESS'
    });

    await newTicket.save();

    return res.json({ success: true, ticket: newTicket });
  } catch (err) {
    console.error('Direct Ticket Booking Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process ticket booking.' });
  }
});

// 2. POST /api/tickets/intent - Create Booking Intent & Dynamic UPI QR Code
router.post('/api/tickets/intent', async (req, res) => {
  try {
    const {
      userName, userContact, eventId, artistName, eventDate,
      tier, quantity, partnerPlatform
    } = req.body;

    if (!userName || !userContact || (!artistName && !eventId)) {
      return res.status(400).json({ success: false, message: 'Name, contact, and event details are required.' });
    }

    const safeTier = String(tier).toUpperCase() === 'VIP' ? 'VIP' : 'GA';
    const unitPrice = safeTier === 'VIP' ? 15000 : 2000;
    const safeQty = Math.min(Math.max(parseInt(quantity) || 1, 1), 10);
    const totalAmount = unitPrice * safeQty;

    const validPlatforms = ['BookMyShow', 'District', 'Sort My Scene', 'SortMyScene', 'Ticket9'];
    const safePlatform = validPlatforms.includes(partnerPlatform) ? partnerPlatform : 'BookMyShow';

    // Unique Booking ID
    const bookingId = 'NICE-' + Math.floor(100000 + Math.random() * 900000);

    // Merchant UPI Configuration Engine
    const merchantUpiId = process.env.MERCHANT_UPI_ID || "echospace@upi";
    const merchantName = "EchoSpace Festival NICE Grounds";

    // Standard upi://pay Protocol Intent Link
    const upiDeepLink = `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('Booking ' + bookingId)}`;

    // Encode into dynamic high-res QR code image URL
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

    const newTicket = new Ticket({
      bookingId,
      userId: req.session && req.session.userId ? req.session.userId : null,
      userName: sanitize(userName),
      userContact: sanitize(userContact),
      eventId: eventId && eventId.match(/^[0-9a-fA-F]{24}$/) ? eventId : null,
      artistName: sanitize(artistName || 'EchoSpace Artist'),
      eventDate: sanitize(eventDate || 'Festival Day'),
      tier: safeTier,
      unitPrice,
      quantity: safeQty,
      totalAmount,
      partnerPlatform: safePlatform,
      paymentStatus: 'PENDING',
      qrCodeUrl: qrCodeImageUrl,
      upiDeepLink
    });

    await newTicket.save();

    return res.json({
      success: true,
      message: 'Booking intent created. Please complete payment via UPI.',
      bookingId,
      upiDeepLink,
      qrCodeImageUrl,
      totalAmount,
      unitPrice,
      quantity: safeQty,
      ticket: newTicket
    });
  } catch (err) {
    console.error('Ticket Intent Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking intent.' });
  }
});

// 3. POST /api/tickets/confirm - Confirm Payment & Atomic Seat Decrement
router.post('/api/tickets/confirm', async (req, res) => {
  try {
    const { bookingId, upiTxnRef } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const ticket = await Ticket.findOne({ bookingId: String(bookingId).trim() });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Booking ID not found.' });
    }

    const generatedTxnRef = upiTxnRef ? sanitize(upiTxnRef) : 'UPI-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    ticket.paymentStatus = 'SUCCESS';
    ticket.upiTxnRef = generatedTxnRef;
    
    // Create an E-Ticket verification QR Code
    ticket.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingId + '|' + ticket.userContact + '|' + ticket.artistName)}`;
    await ticket.save();

    // Atomically decrement available seats in Event collection
    if (ticket.eventId) {
      await Event.findByIdAndUpdate(ticket.eventId, {
        $inc: { availableSeats: -ticket.quantity }
      });
    } else {
      // Fallback: match by artistName or date
      await Event.findOneAndUpdate(
        { artistName: new RegExp(ticket.artistName, 'i') },
        { $inc: { availableSeats: -ticket.quantity } }
      );
    }

    return res.json({
      success: true,
      message: 'Payment Confirmed! E-Ticket Generated.',
      ticket
    });
  } catch (err) {
    console.error('Ticket Confirm Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm booking.' });
  }
});

// 4. POST /api/contest/entry - Submit Lucky Draw Entry
router.post('/api/contest/entry', async (req, res) => {
  try {
    const { name, contact, emailOrPhone, favoriteArtist, reason } = req.body;
    const userContact = String(contact || emailOrPhone || '').trim().toLowerCase();

    if (!name || !userContact || !favoriteArtist || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userContact);
    const isPhone = /^[0-9]{10,15}$/.test(userContact);
    if (!isEmail && !isPhone) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email or phone number.' });
    }

    // Prevent duplicate entries per contact
    const existing = await Contest.findOne({ contact: userContact });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already submitted an entry for the Meet & Win contest.' });
    }

    const entry = new Contest({
      name: sanitize(name),
      contact: userContact,
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
    return res.status(500).json({ success: false, message: 'Failed to submit contest entry.' });
  }
});

// 5. GET /api/admin/contest/pick-winners - Admin Endpoint for Random Draw
router.get('/api/admin/contest/pick-winners', async (req, res) => {
  try {
    const winnerCount = parseInt(req.query.count) || 3;
    
    // Pick random non-winner entries
    const randomWinners = await Contest.aggregate([
      { $match: { isWinner: false } },
      { $sample: { size: winnerCount } }
    ]);

    if (randomWinners.length === 0) {
      return res.json({ success: false, message: 'No eligible contest entries found to select winners.' });
    }

    const winnerIds = randomWinners.map(w => w._id);
    
    await Contest.updateMany(
      { _id: { $in: winnerIds } },
      { $set: { isWinner: true, prize: 'VIP Meet & Greet + Goodies Pass' } }
    );

    const updatedWinners = await Contest.find({ _id: { $in: winnerIds } });

    return res.json({
      success: true,
      message: `Selected ${updatedWinners.length} lucky contest winners!`,
      winners: updatedWinners
    });
  } catch (err) {
    console.error('Pick Winners Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to pick contest winners.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET /api/reviews - Fetch recent reviews for fan wall
router.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(6);
    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, reviews: [] });
  }
});

// POST /api/reviews/new - Post a new review / shoutout
router.post('/api/reviews/new', async (req, res) => {
  try {
    const { author, message, rating } = req.body;
    if (!author || !message) {
      return res.status(400).json({ success: false, message: 'Author name and message are required.' });
    }
    const newReview = await Review.create({
      author: String(author).trim(),
      message: String(message).trim(),
      rating: Number(rating) || 5
    });
    res.json({ success: true, review: newReview });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(400).json({ success: false, message: 'Failed to post review.' });
  }
});

module.exports = router;

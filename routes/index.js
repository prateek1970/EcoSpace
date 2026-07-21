const express = require('express');
const router = express.Router();
const Track = require('../models/Track');
const CollabRequest = require('../models/CollabRequest');

// Allowed category filters
const CATEGORIES = ['Acoustic Cover', 'Original Song', 'Jam Session', 'Snippet'];

// GET / - Public Showcase Page
router.get('/', async (req, res) => {
  try {
    const selectedCategory = req.query.category || '';
    const searchQuery = req.query.search || '';
    const isSubmitted = req.query.submitted === 'true';

    // Build filter object for tracks
    const filter = {};
    if (selectedCategory && CATEGORIES.includes(selectedCategory)) {
      filter.category = selectedCategory;
    }
    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { artistName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Query tracks sorted by newest first
    const tracks = await Track.find(filter).sort({ createdAt: -1 });

    // Fetch open or in review collaboration requests for the community showcase
    const collabRequests = await CollabRequest.find({
      status: { $in: ['Open', 'In Review'] }
    }).sort({ createdAt: -1 }).limit(6);

    // Compute stats
    const totalTracks = await Track.countDocuments();
    const totalCollabs = await CollabRequest.countDocuments();
    const totalLikesResult = await Track.aggregate([
      { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
    ]);
    const totalLikes = totalLikesResult.length > 0 ? totalLikesResult[0].totalLikes : 0;

    res.render('index', {
      tracks,
      collabRequests,
      categories: CATEGORIES,
      selectedCategory,
      searchQuery,
      isSubmitted,
      stats: {
        totalTracks,
        totalCollabs,
        totalLikes
      }
    });
  } catch (error) {
    console.error('Error rendering homepage:', error);
    res.status(500).render('index', {
      tracks: [],
      collabRequests: [],
      categories: CATEGORIES,
      selectedCategory: '',
      searchQuery: '',
      isSubmitted: false,
      stats: { totalTracks: 0, totalCollabs: 0, totalLikes: 0 },
      error: 'Failed to load showcase content.'
    });
  }
});

// POST /api/tracks/:id/like - Non-refresh AJAX Endpoint
router.post('/api/tracks/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTrack = await Track.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!updatedTrack) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    return res.json({
      success: true,
      likes: updatedTrack.likes,
      trackId: updatedTrack._id
    });
  } catch (error) {
    console.error('Error liking track:', error);
    return res.status(500).json({ success: false, message: 'Server error updating likes' });
  }
});

// POST /collab/new - Collaboration Request Form Submission
router.post('/collab/new', async (req, res) => {
  try {
    const { senderName, senderEmail, role, projectType, message } = req.body;

    if (!senderName || !senderEmail || !role || !projectType || !message) {
      return res.redirect('/?error=missing_fields#collab-section');
    }

    await CollabRequest.create({
      senderName,
      senderEmail,
      role,
      projectType,
      message,
      status: 'Open'
    });

    res.redirect('/?submitted=true#collab-section');
  } catch (error) {
    console.error('Error creating collab request:', error);
    res.redirect('/?error=server_error#collab-section');
  }
});

module.exports = router;

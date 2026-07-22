const express = require('express');
const router = express.Router();
const {
  getTracks,
  getTrackStats,
  incrementTrackLikes,
  getCollabRequests,
  addCollabRequest
} = require('../services/dbService');

// Allowed category filters
const CATEGORIES = ['Acoustic Cover', 'Original Song', 'Jam Session', 'Festival Snippet'];

// GET / - Public Showcase Page (EchoSpace)
router.get('/', async (req, res) => {
  try {
    const selectedCategory = req.query.category || '';
    const searchQuery = req.query.search || '';
    const isSubmitted = req.query.submitted === 'true';

    // Query tracks via service (Mongoose / Supabase)
    const tracks = await getTracks(selectedCategory, searchQuery);

    // Fetch open or in-review collaboration requests
    const collabRequests = await getCollabRequests(['Open', 'In Review'], 6);

    // Compute stats
    const stats = await getTrackStats();

    res.render('index', {
      tracks,
      collabRequests,
      categories: CATEGORIES,
      selectedCategory,
      searchQuery,
      isSubmitted,
      stats
    });
  } catch (error) {
    console.error('Error rendering EchoSpace homepage:', error);
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

// POST /api/tracks/:id/like - Non-refreshing AJAX Endpoint
router.post('/api/tracks/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTrack = await incrementTrackLikes(id);

    if (!updatedTrack) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    return res.json({
      success: true,
      likes: updatedTrack.likes,
      trackId: updatedTrack._id || updatedTrack.id
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

    await addCollabRequest({
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

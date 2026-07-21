const express = require('express');
const router = express.Router();
const Track = require('../models/Track');
const CollabRequest = require('../models/CollabRequest');

const CATEGORIES = ['Acoustic Cover', 'Original Song', 'Jam Session', 'Snippet'];
const ROLES = ['Vocalist', 'Guitarist', 'Producer', 'Songwriter', 'Other'];
const STATUSES = ['Open', 'In Review', 'Accepted', 'Closed'];

// GET /admin - Admin Dashboard Panel
router.get('/', async (req, res) => {
  try {
    const tracks = await Track.find().sort({ createdAt: -1 });
    const collabRequests = await CollabRequest.find().sort({ createdAt: -1 });

    const message = req.query.msg || null;
    const error = req.query.err || null;

    res.render('admin', {
      tracks,
      collabRequests,
      categories: CATEGORIES,
      roles: ROLES,
      statuses: STATUSES,
      message,
      error
    });
  } catch (error) {
    console.error('Error loading admin panel:', error);
    res.status(500).render('admin', {
      tracks: [],
      collabRequests: [],
      categories: CATEGORIES,
      roles: ROLES,
      statuses: STATUSES,
      message: null,
      error: 'Failed to load admin panel data.'
    });
  }
});

// POST /admin/tracks/add - Create a New Audio Track
router.post('/tracks/add', async (req, res) => {
  try {
    const { title, artistName, category, audioUrl, description, tags } = req.body;

    if (!title || !audioUrl) {
      return res.redirect('/admin?err=' + encodeURIComponent('Track title and audio URL are required.'));
    }

    // Process tags into an array of strings
    let tagsArray = [];
    if (typeof tags === 'string' && tags.trim() !== '') {
      tagsArray = tags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean);
    } else if (Array.isArray(tags)) {
      tagsArray = tags.map(tag => String(tag).trim().replace(/^#/, '')).filter(Boolean);
    }

    await Track.create({
      title: title.trim(),
      artistName: artistName ? artistName.trim() : 'Solo Artist',
      category: CATEGORIES.includes(category) ? category : 'Acoustic Cover',
      audioUrl: audioUrl.trim(),
      description: description ? description.trim() : '',
      tags: tagsArray
    });

    res.redirect('/admin?msg=' + encodeURIComponent('New track added successfully!'));
  } catch (error) {
    console.error('Error adding track:', error);
    res.redirect('/admin?err=' + encodeURIComponent('Failed to create track. Please verify inputs.'));
  }
});

// POST /admin/tracks/:id/delete - Delete a Track
router.post('/tracks/:id/delete', async (req, res) => {
  try {
    await Track.findByIdAndDelete(req.params.id);
    res.redirect('/admin?msg=' + encodeURIComponent('Track removed successfully.'));
  } catch (error) {
    console.error('Error deleting track:', error);
    res.redirect('/admin?err=' + encodeURIComponent('Failed to delete track.'));
  }
});

// POST /admin/collab/:id/status - Update Collaboration Request Status
router.post('/collab/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.redirect('/admin?err=' + encodeURIComponent('Invalid status selected.'));
    }

    const updated = await CollabRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.redirect('/admin?err=' + encodeURIComponent('Collaboration request not found.'));
    }

    res.redirect('/admin?msg=' + encodeURIComponent(`Collaboration request status updated to "${status}".`));
  } catch (error) {
    console.error('Error updating collab status:', error);
    res.redirect('/admin?err=' + encodeURIComponent('Failed to update request status.'));
  }
});

// POST /admin/collab/:id/delete - Delete a Collaboration Request
router.post('/collab/:id/delete', async (req, res) => {
  try {
    await CollabRequest.findByIdAndDelete(req.params.id);
    res.redirect('/admin?msg=' + encodeURIComponent('Collaboration request deleted.'));
  } catch (error) {
    console.error('Error deleting collab request:', error);
    res.redirect('/admin?err=' + encodeURIComponent('Failed to delete collaboration request.'));
  }
});

module.exports = router;

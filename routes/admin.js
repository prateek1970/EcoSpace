const express = require('express');
const router = express.Router();
const {
  getTracks,
  getAllCollabRequests,
  addTrack,
  deleteTrack,
  updateCollabStatus,
  deleteCollabRequest
} = require('../services/dbService');

const CATEGORIES = ['Acoustic Cover', 'Original Song', 'Jam Session', 'Festival Snippet'];
const ROLES = ['Vocalist', 'Guitarist', 'Producer', 'Songwriter', 'Special Guest'];
const STATUSES = ['Open', 'In Review', 'Accepted', 'Closed'];

// GET /admin - Backstage Control Center (Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const tracks = await getTracks();
    const collabRequests = await getAllCollabRequests();

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

// POST /admin/tracks/new & /admin/tracks/add - Create a New Audio Track
const handleAddTrack = async (req, res) => {
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

    await addTrack({
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
};

router.post('/tracks/add', handleAddTrack);
router.post('/tracks/new', handleAddTrack);

// POST /admin/tracks/:id/delete - Delete a Track
router.post('/tracks/:id/delete', async (req, res) => {
  try {
    await deleteTrack(req.params.id);
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

    const updated = await updateCollabStatus(req.params.id, status);

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
    await deleteCollabRequest(req.params.id);
    res.redirect('/admin?msg=' + encodeURIComponent('Collaboration request deleted.'));
  } catch (error) {
    console.error('Error deleting collab request:', error);
    res.redirect('/admin?err=' + encodeURIComponent('Failed to delete collaboration request.'));
  }
});

module.exports = router;

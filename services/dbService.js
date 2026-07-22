const mongoose = require('mongoose');
const Track = require('../models/Track');
const CollabRequest = require('../models/CollabRequest');
const User = require('../models/User');

// ─── TRACKS OPERATIONS ───────────────────────────────────────────

async function getTracks(selectedCategory = '', searchQuery = '') {
  try {
    const filter = {};
    if (selectedCategory) {
      filter.category = selectedCategory;
    }
    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { artistName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    return await Track.find(filter).sort({ createdAt: -1 });
  } catch (err) {
    console.error('[DB Service] Error getting tracks:', err.message);
    return [];
  }
}

async function getTrackStats() {
  try {
    const totalTracks = await Track.countDocuments();
    const totalCollabs = await CollabRequest.countDocuments();
    const result = await Track.aggregate([
      { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
    ]);
    const totalLikes = result.length > 0 ? result[0].totalLikes : 0;
    return { totalTracks, totalCollabs, totalLikes };
  } catch (err) {
    console.error('[DB Service] Error getting stats:', err.message);
    return { totalTracks: 0, totalCollabs: 0, totalLikes: 0 };
  }
}

async function addTrack(trackData) {
  try {
    return await Track.create(trackData);
  } catch (err) {
    console.error('[DB Service] Error adding track:', err.message);
    throw err;
  }
}

async function deleteTrack(id) {
  try {
    return await Track.findByIdAndDelete(id);
  } catch (err) {
    console.error('[DB Service] Error deleting track:', err.message);
    throw err;
  }
}

async function incrementTrackLikes(id) {
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return await Track.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    } else {
      const track = await Track.findOne();
      if (track) {
        track.likes += 1;
        await track.save();
        return track;
      }
      return null;
    }
  } catch (err) {
    console.error('[DB Service] Error incrementing likes:', err.message);
    return null;
  }
}

// ─── COLLABORATION REQUESTS OPERATIONS ────────────────────────────

async function getCollabRequests(statusFilter = [], limit = 0) {
  try {
    const filter = {};
    if (statusFilter && statusFilter.length > 0) {
      filter.status = { $in: statusFilter };
    }
    let query = CollabRequest.find(filter).sort({ createdAt: -1 });
    if (limit > 0) query = query.limit(limit);
    return await query;
  } catch (err) {
    console.error('[DB Service] Error getting collab requests:', err.message);
    return [];
  }
}

async function addCollabRequest(collabData) {
  try {
    return await CollabRequest.create(collabData);
  } catch (err) {
    console.error('[DB Service] Error adding collab request:', err.message);
    throw err;
  }
}

async function updateCollabStatus(id, status) {
  try {
    return await CollabRequest.findByIdAndUpdate(id, { status }, { new: true });
  } catch (err) {
    console.error('[DB Service] Error updating collab status:', err.message);
    throw err;
  }
}

async function deleteCollabRequest(id) {
  try {
    return await CollabRequest.findByIdAndDelete(id);
  } catch (err) {
    console.error('[DB Service] Error deleting collab request:', err.message);
    throw err;
  }
}

// ─── USER OPERATIONS ──────────────────────────────────────────────

async function findUserByEmail(emailOrPhone) {
  try {
    return await User.findOne({ emailOrPhone: String(emailOrPhone).trim().toLowerCase() });
  } catch (err) {
    console.error('[DB Service] Error finding user:', err.message);
    return null;
  }
}

async function createUser(userData) {
  try {
    return await User.create(userData);
  } catch (err) {
    console.error('[DB Service] Error creating user:', err.message);
    throw err;
  }
}

module.exports = {
  getTracks,
  getTrackStats,
  addTrack,
  deleteTrack,
  incrementTrackLikes,
  getCollabRequests,
  getAllCollabRequests: getCollabRequests,
  addCollabRequest,
  updateCollabStatus,
  deleteCollabRequest,
  findUserByEmail,
  createUser
};

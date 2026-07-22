const mongoose = require('mongoose');
require('dotenv').config();

// SECURITY: Never hardcode credentials — always read from .env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[Database] ❌ FATAL: MONGODB_URI is not set in .env. Server cannot start.');
  process.exit(1);
}

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Connection string must be set in .env (MONGODB_URI).
 */
async function connectDB() {
  try {
    console.log('[Database] Connecting to MongoDB Atlas via Mongoose...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('[Database] ✅ Mongoose connected successfully to MongoDB Atlas.');

    // Clear legacy indexes (e.g. old email_1 index)
    try {
      if (mongoose.connection.collections['users']) {
        await mongoose.connection.collections['users'].dropIndexes();
      }
    } catch (idxErr) {
      // Ignore if index does not exist
    }
  } catch (error) {
    console.error('[Database Error] Mongoose connection error:', error.message);
    throw error;
  }
}

module.exports = connectDB;

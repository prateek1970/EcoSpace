const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Deep2004:Deep2004@prateek.qwa3k5w.mongodb.net/echospace?retryWrites=true&w=majority&appName=Prateek';

/**
 * Connect to MongoDB Atlas using Mongoose and .env connection string
 */
async function connectDB() {
  try {
    console.log('[Database] Connecting to MongoDB Atlas via Mongoose...');
    await mongoose.connect(MONGODB_URI);
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
  }
}

module.exports = connectDB;

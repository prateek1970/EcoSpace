const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/Event');
const connectDB = require('./config/db');

const initialEvents = [
  {
    artistName: 'AR Rahman',
    stage: 'Main Stage',
    date: '27 July 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 50000,
    availableSeats: 48500,
    status: 'UPCOMING',
    imageUrl: '/images/artists/ar_rahman.jpg',
    description: 'Symphonic opening night spectacle live at NICE Grounds.'
  },
  {
    artistName: 'Justin Bieber',
    stage: 'Main Stage',
    date: '28 July 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 50000,
    availableSeats: 9200, // Fast Filling
    status: 'UPCOMING',
    imageUrl: '/images/artists/justin_bieber.jpg',
    description: 'Justice World Tour arena stop in Bengaluru.'
  },
  {
    artistName: 'Shreya Ghoshal',
    stage: 'Main Stage',
    date: '29 July 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 50000,
    availableSeats: 34000,
    status: 'UPCOMING',
    imageUrl: '/images/artists/shreya_ghoshal.jpg',
    description: 'Symphonic melody night with grand live orchestra.'
  },
  {
    artistName: 'Anuv Jain',
    stage: 'Acoustic Arena',
    date: '30 July 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 30000,
    availableSeats: 21000,
    status: 'UPCOMING',
    imageUrl: '/images/artists/anuv_jain.jpg',
    description: 'Intimate indie acoustic night under the stars.'
  },
  {
    artistName: 'Ed Sheeran',
    stage: 'Main Stage',
    date: '31 July 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 50000,
    availableSeats: 4500, // Fast Filling
    status: 'UPCOMING',
    imageUrl: '/images/artists/ed_sheeran.jpg',
    description: '+-=÷x Mathematics Tour Live setup.'
  },
  {
    artistName: 'Coldplay',
    stage: 'Grand Stage',
    date: '01 August 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 60000,
    availableSeats: 0, // Sold Out
    status: 'UPCOMING',
    imageUrl: '/images/artists/coldplay.webp',
    description: 'Music of the Spheres Stadium Experience & LED Wristbands.'
  },
  {
    artistName: 'Alan Walker',
    stage: 'EDM Dome',
    date: '02 August 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 40000,
    availableSeats: 18500,
    status: 'UPCOMING',
    imageUrl: '/images/artists/alan_walker.jpg',
    description: 'WalkerWorld laser lights & electronic dance show.'
  },
  {
    artistName: 'Arijit Singh',
    stage: 'Grand Finale',
    date: '03 August 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 60000,
    availableSeats: 7800, // Fast Filling
    status: 'UPCOMING',
    imageUrl: '/images/artists/arijit_singh.jpg',
    description: 'Emotional Bollywood acoustic night & hits collection.'
  },
  {
    artistName: 'Maroon 5',
    stage: 'Mega Closing',
    date: '04 August 2026',
    startTime: '18:00',
    endTime: '22:00',
    totalCapacity: 50000,
    availableSeats: 31000,
    status: 'UPCOMING',
    imageUrl: '/images/artists/maroon5.webp',
    description: 'Grand finale night with full band hits & laser extravaganza.'
  }
];

async function seedEvents() {
  try {
    await connectDB();
    const count = await Event.countDocuments();
    if (count === 0) {
      console.log('[Seeder] Seeding 9 concert events into MongoDB...');
      await Event.create(initialEvents);
      console.log('[Seeder] ✅ Successfully seeded 9 concert events.');
    } else {
      console.log(`[Seeder] Events collection already contains ${count} records. Skipping.`);
    }
  } catch (err) {
    console.error('[Seeder Error] Failed to seed events:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

if (require.main === module) {
  seedEvents();
}

module.exports = { initialEvents, seedEvents };

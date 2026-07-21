const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const { loadUser, requireAuth } = require('./middleware/authMiddleware');
const Track = require('./models/Track');
const CollabRequest = require('./models/CollabRequest');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/music_showcase';

// Configure View Engine & Public Static Directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser & Static Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'echohub_fallback_secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true
  }
}));

// Load current user for all views (navbar state)
app.use(loadUser);

// Mount Application Routes
app.use('/auth', authRoutes);
app.use('/', requireAuth, indexRoutes);
app.use('/admin', requireAuth, adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('index', {
    tracks: [],
    collabRequests: [],
    categories: ['Acoustic Cover', 'Original Song', 'Jam Session', 'Snippet'],
    selectedCategory: '',
    searchQuery: '',
    isSubmitted: false,
    stats: { totalTracks: 0, totalCollabs: 0, totalLikes: 0 },
    error: '404 - Page or Resource Not Found'
  });
});

// Database Connection & Server Initializer
async function startServer() {
  try {
    console.log(`[Database] Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Database] MongoDB connection established successfully.');

    // Seed database if empty
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🎵 Echo Showcase Hub is live on http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Database Error] Failed to connect to MongoDB:', error.message);
    console.log('[Info] Attempting server start anyway (routes will handle fallback error state gracefully)...');
    
    app.listen(PORT, () => {
      console.log(`⚠️ Server running in fallback mode on http://localhost:${PORT}`);
    });
  }
}

/**
 * Seed initial sample tracks and collab calls if database is empty
 */
async function seedInitialData() {
  try {
    const trackCount = await Track.countDocuments();
    if (trackCount === 0) {
      console.log('[Seeder] Populating database with sample acoustic tracks...');
      await Track.create([
        {
          title: 'Midnight Strum & Melody',
          artistName: 'Maya Lin',
          category: 'Original Song',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          description: 'A cozy fingerstyle acoustic track recorded in Standard E tuning with Neumann KM184 mics.',
          likes: 42,
          tags: ['fingerstyle', 'acoustic', 'chill', 'ambient']
        },
        {
          title: 'Sunset Boulevard (Acoustic Cover)',
          artistName: 'Leo Vance',
          category: 'Acoustic Cover',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          description: 'Stripped-back acoustic guitar cover featuring warm natural room reverb and soft vocal backing.',
          likes: 28,
          tags: ['cover', 'indie', 'guitar']
        },
        {
          title: 'Sunday Morning Jam Session',
          artistName: 'Echo Trio Jam',
          category: 'Jam Session',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          description: 'Improvised acoustic groove in G Major with cajon and rhythm guitar.',
          likes: 19,
          tags: ['jam', 'improvisation', 'cajon', 'groove']
        },
        {
          title: 'Acoustic Harmony Snippet #4',
          artistName: 'Clara & The Waves',
          category: 'Snippet',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          description: 'Idea for an upcoming EP chorus. Looking for a lead vocalist to collaborate on full track!',
          likes: 35,
          tags: ['snippet', 'harmony', 'wip']
        }
      ]);
      console.log('[Seeder] Sample tracks created successfully.');
    }

    const collabCount = await CollabRequest.countDocuments();
    if (collabCount === 0) {
      console.log('[Seeder] Populating database with sample collaboration requests...');
      await CollabRequest.create([
        {
          senderName: 'Sarah Jenkins',
          senderEmail: 'sarah.vocals@example.com',
          role: 'Vocalist',
          projectType: 'Indie Folk Single',
          message: 'Looking for a soulful female or male vocalist for an acoustic indie song. Key of D, 95 BPM. Demo available!',
          status: 'Open'
        },
        {
          senderName: 'Marcus Cole',
          senderEmail: 'marcus.producer@example.com',
          role: 'Producer',
          projectType: 'Acoustic Pop EP',
          message: 'Acoustic producer seeking a songwriter/guitarist to collaborate on 3 stripped-back tracks for Spotify release.',
          status: 'In Review'
        }
      ]);
      console.log('[Seeder] Sample collaboration requests created successfully.');
    }
  } catch (err) {
    console.error('[Seeder Error] Failed to seed initial data:', err);
  }
}

// Execute Server Startup
startServer();

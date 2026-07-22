const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const bookingRoutes = require('./routes/booking');
const { loadUser, requireAuth } = require('./middleware/authMiddleware');
const connectDB = require('./config/db');
const Track = require('./models/Track');
const CollabRequest = require('./models/CollabRequest');
const Review = require('./models/Review');
const Event = require('./models/Event');
const { initialEvents } = require('./seedEvents');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// SECURITY: Validate required env vars at startup
// ─────────────────────────────────────────────
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'echohub_fallback_secret') {
  console.error('[Config] ❌ SESSION_SECRET is weak or not set in .env. Please set a strong random secret.');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

// ─────────────────────────────────────────────
// SECURITY: Helmet — set secure HTTP headers
// ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",  // needed for inline scripts in EJS
        'https://cdn.tailwindcss.com',
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.tailwindcss.com',
        'https://cdnjs.cloudflare.com'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com'
      ],
      imgSrc: ["'self'", 'data:', 'https://api.qrserver.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false  // allow fonts/cdn
}));

// ─────────────────────────────────────────────
// SECURITY: Global rate limiter — prevent DDoS/brute force
// ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use(globalLimiter);

// ─────────────────────────────────────────────
// SECURITY: Tighter rate limiter on auth endpoints
// ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 10 minutes.' }
});
app.use('/auth/send-otp', authLimiter);
app.use('/auth/verify-otp', authLimiter);
app.use('/auth/login', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/login', authLimiter);

// Configure View Engine & Public Static Directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser & Static Middleware — SECURITY: limit body size
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0'
}));

// ─────────────────────────────────────────────
// SECURITY: Session — secure cookies, no guessable secret
// ─────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,                    // block JS access to cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax'                   // CSRF protection
  }
}));

// Load current user for all views (navbar state)
app.use(loadUser);

// Mount Application Routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/', indexRoutes);
app.use('/', reviewRoutes);
app.use('/', bookingRoutes);
app.use('/admin', requireAuth, adminRoutes);

// ─────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('index', {
    tracks: [],
    collabRequests: [],
    categories: ['Acoustic Cover', 'Original Song', 'Jam Session', 'Festival Snippet'],
    selectedCategory: '',
    searchQuery: '',
    isSubmitted: false,
    stats: { totalTracks: 0, totalCollabs: 0, totalLikes: 0 },
    error: '404 - Page or Resource Not Found'
  });
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ success: false, message: 'An internal server error occurred.' });
});

// ─────────────────────────────────────────────
// Database Connection & Server Initializer
// ─────────────────────────────────────────────
async function startServer() {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`⚡ EchoSpace (MongoDB Atlas) is live on http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Database Error] MongoDB Atlas connection error:', error.message);
    console.log('[Info] Cannot start server without database. Exiting...');
    process.exit(1);
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
          description: 'A cozy fingerstyle acoustic track recorded in Standard E tuning.',
          likes: 42,
          tags: ['fingerstyle', 'acoustic', 'chill', 'ambient']
        },
        {
          title: 'Sunset Boulevard (Acoustic Cover)',
          artistName: 'Leo Vance',
          category: 'Acoustic Cover',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          description: 'Stripped-back acoustic guitar cover with soft vocal backing.',
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
          category: 'Festival Snippet',
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
          description: 'Idea for an upcoming EP chorus. Looking for a lead vocalist!',
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
          message: 'Looking for a soulful vocalist for an acoustic indie song.',
          status: 'Open'
        },
        {
          senderName: 'Marcus Cole',
          senderEmail: 'marcus.producer@example.com',
          role: 'Producer',
          projectType: 'Acoustic Pop EP',
          message: 'Acoustic producer seeking a songwriter/guitarist to collaborate on 3 stripped-back tracks.',
          status: 'In Review'
        }
      ]);
      console.log('[Seeder] Sample collaboration requests created successfully.');
    }

    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      console.log('[Seeder] Populating database with sample fan wall reviews...');
      await Review.create([
        { author: 'Aarav Sharma', message: 'A.R. Rahman opening night was pure magic! Unforgettable experience at NICE Grounds.', rating: 5 },
        { author: 'Priya Nair', message: 'Coldplay LED wristbands turned the arena into a galaxy! 10/10 organization.', rating: 5 },
        { author: 'Rohan Mehta', message: 'Arijit Singh finale gave me chills. The acoustic arrangements were phenomenal!', rating: 5 }
      ]);
      console.log('[Seeder] Sample reviews created successfully.');
    }

    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('[Seeder] Populating database with 9 concert events...');
      await Event.create(initialEvents);
      console.log('[Seeder] Sample 9 concert events created successfully.');
    }
  } catch (err) {
    console.error('[Seeder Error] Failed to seed initial data:', err);
  }
}

// Execute Server Startup
startServer();

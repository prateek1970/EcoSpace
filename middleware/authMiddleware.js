const User = require('../models/User');

/**
 * Middleware: Require the user to be logged in.
 * Redirects to /auth/login if no session exists.
 * SECURITY: Only trust session.userId — do not trust raw session.user data alone.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  // If JSON request, return 401 instead of redirect
  if (req.accepts('json')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  return res.redirect('/auth/login');
}

/**
 * Middleware: Load current user from DB into res.locals for all views.
 * SECURITY: Always re-fetch user from DB rather than trusting session data directly.
 */
async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  if (req.session && req.session.userId) {
    try {
      // SECURITY: Verify user still exists in DB on every request
      const user = await User.findById(req.session.userId).select('-otp -otpExpires');
      if (user && user.isVerified) {
        res.locals.currentUser = user;
      } else {
        // User was deleted or is unverified — invalidate session
        req.session.destroy(() => {});
      }
    } catch (err) {
      console.error('[Auth Middleware] Error loading user:', err.message);
    }
  }
  next();
}

module.exports = { requireAuth, loadUser };

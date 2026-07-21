const User = require('../models/User');

/**
 * Middleware: Require the user to be logged in.
 * Redirects to /auth/login if no session exists.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/auth/login');
}

/**
 * Middleware: Load the current user into res.locals for all views.
 * Does not block the request if no user is found.
 */
async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user && user.isFullyVerified) {
        res.locals.currentUser = user;
      }
    } catch (err) {
      console.error('[Auth Middleware] Error loading user:', err.message);
    }
  }
  next();
}

module.exports = { requireAuth, loadUser };

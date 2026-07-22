const User = require('../models/User');

/**
 * Middleware: Require the user to be logged in.
 * Redirects to /auth/login if no session exists.
 */
function requireAuth(req, res, next) {
  if (req.session && (req.session.userId || req.session.user)) {
    return next();
  }
  return res.redirect('/auth/login');
}

/**
 * Middleware: Load current user into res.locals for all views.
 */
async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  if (req.session && (req.session.userId || req.session.user)) {
    try {
      const userId = req.session.userId || (req.session.user && req.session.user.id);
      const user = await User.findById(userId);
      if (user) {
        res.locals.currentUser = user;
      } else if (req.session.user) {
        res.locals.currentUser = req.session.user;
      }
    } catch (err) {
      console.error('[Auth Middleware] Error loading user:', err.message);
      if (req.session.user) {
        res.locals.currentUser = req.session.user;
      }
    }
  }
  next();
}

module.exports = { requireAuth, loadUser };

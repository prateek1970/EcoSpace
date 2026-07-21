const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOTP, sendEmailOTP, sendMobileOTP } = require('../utils/otpService');
const { requireAuth } = require('../middleware/authMiddleware');

const OTP_EXPIRY_MINUTES = 5;

// ─── Helper: Create & store OTP ─────────────────────────────────
async function createAndSendOTP(identifier, type) {
  // Remove any existing OTP for this identifier + type
  await Otp.deleteMany({ identifier: identifier.toLowerCase(), type });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.create({
    identifier: identifier.toLowerCase(),
    type,
    code,
    expiresAt
  });

  let result;
  if (type === 'email') {
    result = await sendEmailOTP(identifier, code);
  } else {
    result = await sendMobileOTP(identifier, code);
  }

  return { ...result, code };
}

// ─── GET /auth/register ──────────────────────────────────────────
router.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/auth/profile');
  }
  res.render('register', {
    error: req.query.err || null,
    message: req.query.msg || null
  });
});

// ─── POST /auth/register ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    if (!name || !email || !mobile) {
      return res.redirect('/auth/register?err=' + encodeURIComponent('All fields are required.'));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.redirect('/auth/register?err=' + encodeURIComponent('Please enter a valid email address.'));
    }

    // Validate mobile (10+ digits)
    const mobileClean = mobile.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{10,15}$/.test(mobileClean)) {
      return res.redirect('/auth/register?err=' + encodeURIComponent('Please enter a valid mobile number (10-15 digits).'));
    }

    // Check if user already exists and is fully verified
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isFullyVerified) {
      return res.redirect('/auth/login?msg=' + encodeURIComponent('Account already exists. Please login.'));
    }

    // If user exists but isn't verified, delete and re-register
    if (existingUser && !existingUser.isFullyVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }

    // Create unverified user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobileClean
    });

    // Store registration data in session for verification
    req.session.pendingUserId = user._id;
    req.session.pendingEmail = user.email;
    req.session.pendingMobile = user.mobile;
    req.session.authFlow = 'register';

    // Send OTPs to both email and mobile
    const emailResult = await createAndSendOTP(user.email, 'email');
    const mobileResult = await createAndSendOTP(user.mobile, 'sms');

    // Store generated OTP codes in session for display
    req.session.simulatedEmailOtp = emailResult.code;
    req.session.simulatedMobileOtp = mobileResult.code;

    req.session.save((err) => {
      if (err) console.error('[Auth] Session save error:', err);
      res.redirect('/auth/verify');
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    res.redirect('/auth/register?err=' + encodeURIComponent('Registration failed. Please try again.'));
  }
});

// ─── GET /auth/login ─────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/auth/profile');
  }
  res.render('login', {
    error: req.query.err || null,
    message: req.query.msg || null
  });
});

// ─── POST /auth/login ────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email || !mobile) {
      return res.redirect('/auth/login?err=' + encodeURIComponent('Email and mobile number are required.'));
    }

    const mobileClean = mobile.replace(/[\s\-\(\)]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    // Find user by email or mobile
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.findOne({ mobile: mobileClean });
    }

    // If user doesn't exist yet, create pending profile seamlessly
    if (!user) {
      user = await User.create({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        mobile: mobileClean
      });
    } else {
      // Update mobile if changed
      user.mobile = mobileClean;
      await user.save();
    }

    // Store login data in session for verification
    req.session.pendingUserId = user._id;
    req.session.pendingEmail = user.email;
    req.session.pendingMobile = user.mobile;
    req.session.authFlow = 'login';

    // Send OTPs
    const emailResult = await createAndSendOTP(user.email, 'email');
    const mobileResult = await createAndSendOTP(user.mobile, 'sms');

    req.session.simulatedEmailOtp = emailResult.code;
    req.session.simulatedMobileOtp = mobileResult.code;

    req.session.save((err) => {
      if (err) console.error('[Auth] Session save error:', err);
      res.redirect('/auth/verify');
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.redirect('/auth/login?err=' + encodeURIComponent('Login failed. Please try again.'));
  }
});

// ─── GET /auth/verify ────────────────────────────────────────────
router.get('/verify', (req, res) => {
  if (!req.session.pendingEmail) {
    return res.redirect('/auth/login');
  }
  res.render('verify-otp', {
    email: req.session.pendingEmail,
    mobile: req.session.pendingMobile,
    authFlow: req.session.authFlow || 'register',
    simulatedEmailOtp: req.session.simulatedEmailOtp || null,
    simulatedMobileOtp: req.session.simulatedMobileOtp || null,
    error: req.query.err || null,
    message: req.query.msg || null
  });
});

// ─── POST /auth/verify ───────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { emailOtp, mobileOtp } = req.body;
    const { pendingUserId, pendingEmail, pendingMobile, simulatedEmailOtp, simulatedMobileOtp } = req.session;

    if (!pendingEmail || !pendingMobile || !pendingUserId) {
      return res.redirect('/auth/login?err=' + encodeURIComponent('Session expired. Please try again.'));
    }

    const cleanEmailOtp = String(emailOtp || '').trim();
    const cleanMobileOtp = String(mobileOtp || '').trim();

    if (!cleanEmailOtp || !cleanMobileOtp) {
      return res.redirect('/auth/verify?err=' + encodeURIComponent('Both OTP codes are required.'));
    }

    // 1. Verify email OTP (check MongoDB Otp doc OR session match)
    const emailOtpDoc = await Otp.findOne({
      identifier: pendingEmail.toLowerCase(),
      type: 'email',
      code: cleanEmailOtp
    });
    const isEmailValid = Boolean(emailOtpDoc || (simulatedEmailOtp && simulatedEmailOtp === cleanEmailOtp));

    // 2. Verify mobile OTP (check MongoDB Otp doc OR session match)
    const mobileOtpDoc = await Otp.findOne({
      identifier: pendingMobile.toLowerCase(),
      type: 'sms',
      code: cleanMobileOtp
    });
    const isMobileValid = Boolean(mobileOtpDoc || (simulatedMobileOtp && simulatedMobileOtp === cleanMobileOtp));

    console.log(`[Auth Verify Attempt] Email Valid: ${isEmailValid}, Mobile Valid: ${isMobileValid}`);

    if (!isEmailValid && !isMobileValid) {
      return res.redirect('/auth/verify?err=' + encodeURIComponent('Both Email and Mobile OTP codes are incorrect.'));
    }

    if (!isEmailValid) {
      return res.redirect('/auth/verify?err=' + encodeURIComponent('Email OTP code is incorrect.'));
    }

    if (!isMobileValid) {
      return res.redirect('/auth/verify?err=' + encodeURIComponent('Mobile OTP code is incorrect.'));
    }

    // Both OTPs verified! Update user
    await User.findByIdAndUpdate(pendingUserId, {
      isEmailVerified: true,
      isMobileVerified: true,
      isFullyVerified: true
    });

    // Clean up OTPs
    await Otp.deleteMany({ identifier: pendingEmail.toLowerCase(), type: 'email' });
    await Otp.deleteMany({ identifier: pendingMobile.toLowerCase(), type: 'sms' });

    // Set authenticated session
    req.session.userId = pendingUserId;
    delete req.session.pendingUserId;
    delete req.session.pendingEmail;
    delete req.session.pendingMobile;
    delete req.session.authFlow;
    delete req.session.simulatedEmailOtp;
    delete req.session.simulatedMobileOtp;

    req.session.save((err) => {
      if (err) console.error('[Auth] Session save error:', err);
      res.redirect('/auth/profile?msg=' + encodeURIComponent('Welcome to EchoHub! Your account is verified.'));
    });
  } catch (error) {
    console.error('[Auth] Verification error:', error);
    res.redirect('/auth/verify?err=' + encodeURIComponent('Verification failed. Please try again.'));
  }
});

// ─── POST /auth/resend/:type ─────────────────────────────────────
router.post('/resend/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { pendingEmail, pendingMobile } = req.session;

    if (!pendingEmail || !pendingMobile) {
      return res.redirect('/auth/login?err=' + encodeURIComponent('Session expired. Please try again.'));
    }

    if (type === 'email') {
      const result = await createAndSendOTP(pendingEmail, 'email');
      req.session.simulatedEmailOtp = result.simulated ? result.code : null;
      return res.redirect('/auth/verify?msg=' + encodeURIComponent('Email OTP resent successfully!'));
    } else if (type === 'sms') {
      const result = await createAndSendOTP(pendingMobile, 'sms');
      req.session.simulatedMobileOtp = result.code;
      return res.redirect('/auth/verify?msg=' + encodeURIComponent('Mobile OTP resent successfully!'));
    }

    res.redirect('/auth/verify');
  } catch (error) {
    console.error('[Auth] Resend error:', error);
    res.redirect('/auth/verify?err=' + encodeURIComponent('Failed to resend OTP.'));
  }
});

// ─── GET /auth/profile ───────────────────────────────────────────
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.redirect('/auth/login?err=' + encodeURIComponent('User not found.'));
    }
    res.render('profile', {
      user,
      message: req.query.msg || null,
      error: req.query.err || null
    });
  } catch (error) {
    console.error('[Auth] Profile error:', error);
    res.redirect('/?err=profile_error');
  }
});

// ─── GET /auth/logout ────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('[Auth] Logout error:', err);
    res.redirect('/auth/login?msg=' + encodeURIComponent('You have been logged out.'));
  });
});

module.exports = router;

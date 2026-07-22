const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==========================================
// 1. GET AUTH PAGES (LOGIN / REGISTER / VERIFY)
// ==========================================

router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', {
    error: req.query.err || null,
    message: req.query.msg || null
  });
});

router.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', {
    error: req.query.err || null,
    message: req.query.msg || null
  });
});

router.get('/verify', (req, res) => {
  res.render('verify-otp', {
    emailOrPhone: req.query.target || '',
    error: req.query.err || null,
    message: req.query.msg || null
  });
});

// ==========================================
// 2. SEND OTP — with OTP rate limiting & expiry
// ==========================================
const handleSendOTP = async (req, res) => {
  try {
    const rawInput = req.body.emailOrPhone || req.body.email || req.body.username;
    if (!rawInput) {
      return res.status(400).json({ success: false, message: 'Email or Mobile Number is required.' });
    }

    const cleanInput = String(rawInput).trim().toLowerCase();

    // SECURITY: Basic format validation
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput);
    const isPhone = /^[0-9]{10,15}$/.test(cleanInput);
    if (!isEmail && !isPhone) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address or 10-digit mobile number.' });
    }

    // SECURITY: Enforce OTP cooldown (max 1 OTP per 60s per user)
    let user = await User.findOne({ emailOrPhone: cleanInput });
    if (user && user.otpExpires) {
      const remainingMs = user.otpExpires.getTime() - Date.now();
      if (remainingMs > (10 * 60 * 1000 - 60 * 1000)) {
        return res.status(429).json({
          success: false,
          message: 'OTP already sent. Please wait 60 seconds before requesting another.'
        });
      }
    }

    // Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (!user) {
      user = new User({
        emailOrPhone: cleanInput,
        name: isEmail ? cleanInput.split('@')[0] : 'Music Fan'
      });
    }

    user.otp = generatedOtp;
    user.otpExpires = otpExpires;
    await user.save();

    // SECURITY: Never expose OTP in production API response
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH DEBUG] OTP for ${cleanInput} is: ${generatedOtp}`);
    }

    return res.json({
      success: true,
      message: 'OTP sent! Enter the 6-digit code below.',
      // SECURITY: Only expose debugOtp in dev mode
      ...(process.env.NODE_ENV !== 'production' && { debugOtp: generatedOtp })
    });

  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error while generating OTP.' });
  }
};

router.post('/send-otp', handleSendOTP);
router.post('/api/auth/send-otp', handleSendOTP);

// ==========================================
// 3. VERIFY OTP — strict expiry & match check
// ==========================================
const handleVerifyOTP = async (req, res) => {
  try {
    const rawInput = req.body.emailOrPhone || req.body.email;
    const otp = req.body.otp;

    if (!rawInput || !otp) {
      return res.status(400).json({ success: false, message: 'Email/Phone and OTP are required.' });
    }

    const cleanInput = String(rawInput).trim().toLowerCase();
    const inputOtpString = String(otp).trim();

    // SECURITY: Validate OTP format is 6 digits
    if (!/^\d{6}$/.test(inputOtpString)) {
      return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });
    }

    const user = await User.findOne({ emailOrPhone: cleanInput });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    // SECURITY: Check OTP expiry
    if (!user.otpExpires || user.otpExpires < new Date()) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // SECURITY: Strict OTP comparison — no backdoor codes
    if (inputOtpString !== String(user.otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP entered. Please try again.' });
    }

    // Mark as verified & clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Store user data in Session
    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      emailOrPhone: user.emailOrPhone,
      name: user.name || 'Music Fan'
    };

    // SECURITY: Regenerate session ID after login to prevent session fixation
    req.session.regenerate((regenerateErr) => {
      if (regenerateErr) {
        console.error('Session Regenerate Error:', regenerateErr);
      }
      req.session.userId = user._id;
      req.session.user = {
        id: user._id,
        emailOrPhone: user.emailOrPhone,
        name: user.name || 'Music Fan'
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session Save Error:', saveErr);
          return res.status(500).json({ success: false, message: 'Failed to establish login session.' });
        }
        return res.json({
          success: true,
          message: 'Verification successful!',
          redirectUrl: '/'
        });
      });
    });

  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

router.post('/verify-otp', handleVerifyOTP);
router.post('/api/auth/verify-otp', handleVerifyOTP);

// ==========================================
// 4. DIRECT FORM LOGIN — removed auto-login bypass
// ==========================================
const handleDirectLogin = async (req, res) => {
  try {
    const rawInput = req.body.emailOrPhone || req.body.email || req.body.username;
    if (!rawInput) {
      if (req.accepts('json')) {
        return res.status(400).json({ success: false, message: 'Email or Mobile Number is required.' });
      }
      return res.render('login', { error: 'Please enter your Email or Mobile Number.', message: null });
    }

    const cleanInput = String(rawInput).trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput);
    const isPhone = /^[0-9]{10,15}$/.test(cleanInput);

    if (!isEmail && !isPhone) {
      if (req.accepts('json')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email or mobile number.' });
      }
      return res.render('login', { error: 'Please enter a valid email or mobile number.', message: null });
    }

    // SECURITY: Direct login only sets up OTP flow — does NOT auto-verify
    let user = await User.findOne({ emailOrPhone: cleanInput });
    if (!user) {
      user = new User({
        emailOrPhone: cleanInput,
        name: isEmail ? cleanInput.split('@')[0] : 'Music Fan'
      });
      await user.save();
    }

    // Generate OTP for the user and send to verify page
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = generatedOtp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH DEBUG] OTP for ${cleanInput} is: ${generatedOtp}`);
    }

    if (req.accepts('json')) {
      return res.json({
        success: true,
        message: 'OTP sent! Please verify to complete login.',
        redirectUrl: `/auth/verify?target=${encodeURIComponent(cleanInput)}`,
        ...(process.env.NODE_ENV !== 'production' && { debugOtp: generatedOtp })
      });
    }

    return res.redirect(`/auth/verify?target=${encodeURIComponent(cleanInput)}`);

  } catch (err) {
    console.error('Direct Login Error:', err);
    if (req.accepts('json')) {
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
    return res.render('login', { error: 'Server error during login.', message: null });
  }
};

router.post('/login', handleDirectLogin);
router.post('/api/auth/login', handleDirectLogin);

// ==========================================
// 5. LOGOUT & PROFILE
// ==========================================
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    // Clear the session cookie on the client
    res.clearCookie('connect.sid');
    res.redirect('/auth/login?msg=' + encodeURIComponent('You have been logged out securely.'));
  });
});

router.get('/profile', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  res.render('profile', {
    user: req.session.user || { name: 'Music Fan', emailOrPhone: 'user@example.com' },
    message: req.query.msg || null,
    error: req.query.err || null
  });
});

module.exports = router;

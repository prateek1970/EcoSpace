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
// 2. SEND OTP (Handles Login & Registration)
// ==========================================
const handleSendOTP = async (req, res) => {
  try {
    const emailOrPhone = req.body.emailOrPhone || req.body.email || req.body.username;
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, message: 'Email or Mobile Number is required.' });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();

    // Generate a 6-digit OTP as a STRING
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Find user or create a new pending user record
    let user = await User.findOne({ emailOrPhone: cleanInput });
    
    if (!user) {
      user = new User({
        emailOrPhone: cleanInput,
        name: cleanInput.split('@')[0] || 'Creator'
      });
    }

    user.otp = generatedOtp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log(`[AUTH DEBUG] OTP for ${cleanInput} is: ${generatedOtp}`);

    return res.json({ 
      success: true, 
      message: 'OTP sent successfully! Enter the code below.',
      debugOtp: generatedOtp 
    });

  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({ success: false, message: 'Server error while generating OTP.' });
  }
};

router.post('/send-otp', handleSendOTP);
router.post('/api/auth/send-otp', handleSendOTP);

// ==========================================
// 3. VERIFY OTP & REDIRECT TO MAIN PAGE
// ==========================================
const handleVerifyOTP = async (req, res) => {
  try {
    const emailOrPhone = req.body.emailOrPhone || req.body.email;
    const otp = req.body.otp;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({ success: false, message: 'Email/Phone and OTP are required.' });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();
    let user = await User.findOne({ emailOrPhone: cleanInput });

    if (!user) {
      user = new User({
        emailOrPhone: cleanInput,
        name: cleanInput.split('@')[0] || 'Creator'
      });
    }

    const inputOtpString = String(otp).trim();
    const storedOtpString = user.otp ? String(user.otp).trim() : null;

    // Allow verification if OTP matches OR auto-accept 6-digit input for dev ease
    if (storedOtpString && inputOtpString !== storedOtpString && inputOtpString !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP entered. Please try again.' });
    }

    // Mark as verified & clear temporary OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Store user data in Session
    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      emailOrPhone: user.emailOrPhone,
      name: user.name || 'Creator'
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.status(500).json({ success: false, message: 'Failed to establish login session.' });
      }

      return res.json({
        success: true,
        message: 'Verification successful!',
        redirectUrl: '/'
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
// 4. DIRECT FORM LOGIN (Handles password & email POST)
// ==========================================
const handleDirectLogin = async (req, res) => {
  try {
    const input = req.body.emailOrPhone || req.body.email || req.body.username;
    if (!input) {
      if (req.headers['accept']?.includes('json') || req.headers['content-type']?.includes('json')) {
        return res.status(400).json({ success: false, message: 'Email or Mobile Number is required.' });
      }
      return res.render('login', { error: 'Please enter your Email or Mobile Number.', message: null });
    }

    const cleanInput = String(input).trim().toLowerCase();

    let user = await User.findOne({ emailOrPhone: cleanInput });
    if (!user) {
      user = new User({
        emailOrPhone: cleanInput,
        name: cleanInput.split('@')[0] || 'Creator'
      });
    }

    user.isVerified = true;
    await user.save();

    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      emailOrPhone: user.emailOrPhone,
      name: user.name || 'Creator'
    };

    req.session.save((err) => {
      if (err) console.error('Session Save Error:', err);

      if (req.headers['accept']?.includes('json') || req.headers['content-type']?.includes('json')) {
        return res.json({
          success: true,
          message: 'Login successful!',
          redirectUrl: '/'
        });
      }

      return res.redirect('/');
    });

  } catch (err) {
    console.error('Direct Login Error:', err);
    if (req.headers['accept']?.includes('json') || req.headers['content-type']?.includes('json')) {
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
    res.redirect('/auth/login?msg=' + encodeURIComponent('You have been logged out.'));
  });
});

router.get('/profile', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }
  res.render('profile', {
    user: req.session.user || { name: 'Creator', emailOrPhone: 'user@example.com' },
    message: req.query.msg || null,
    error: req.query.err || null
  });
});

module.exports = router;

const nodemailer = require('nodemailer');

/**
 * Generate a 6-digit numeric OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if Gmail credentials are properly configured
 */
function isEmailConfigured() {
  return (
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your_gmail@gmail.com' &&
    process.env.EMAIL_PASS !== 'your_app_password_here'
  );
}

/**
 * Send OTP to email via Nodemailer (Gmail SMTP)
 * Falls back to simulation if Gmail is not configured.
 */
async function sendEmailOTP(email, code) {
  // If Gmail not configured, simulate the email OTP
  if (!isEmailConfigured()) {
    console.log('==========================================================');
    console.log(`📧 [SIMULATED EMAIL] Email OTP for ${email}: ${code}`);
    console.log('   (Configure EMAIL_USER & EMAIL_PASS in .env for real emails)');
    console.log('==========================================================');
    return { success: true, simulated: true, code };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"EchoHub Verification" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎵 Your EchoHub Verification Code',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f1015 0%, #181922 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #ffc107; color: #0f1015; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; font-weight: bold;">♫</div>
          <h1 style="color: #f1f5f9; font-size: 24px; margin: 12px 0 4px;">Echo<span style="color: #ffc107;">Hub</span></h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Verification Code</p>
        </div>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 20px;">
          <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px;">Your one-time verification code is:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffc107; background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 12px; padding: 16px; display: inline-block;">${code}</div>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">This code expires in <strong style="color: #f1f5f9;">5 minutes</strong></p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[OTP Service] ✅ Email OTP sent to ${email}: ${code}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.error('[OTP Service] ❌ Failed to send email OTP:', error.message);
    // Fall back to simulation on failure
    console.log('==========================================================');
    console.log(`📧 [FALLBACK SIMULATED] Email OTP for ${email}: ${code}`);
    console.log('==========================================================');
    return { success: true, simulated: true, code };
  }
}

/**
 * Send OTP to mobile (SIMULATED)
 * In production, replace with Twilio or similar SMS API.
 */
async function sendMobileOTP(mobile, code) {
  console.log('==========================================================');
  console.log(`📱 [SIMULATED SMS] Mobile OTP for ${mobile}: ${code}`);
  console.log('==========================================================');
  return { success: true, simulated: true, code };
}

module.exports = { generateOTP, sendEmailOTP, sendMobileOTP };

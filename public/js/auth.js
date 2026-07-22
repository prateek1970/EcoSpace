// Client-Side Authentication Script for EchoSpace OTP Flow

let userTarget = '';

// 1. Send OTP Handler
async function handleSendOTP() {
  const inputEl = document.getElementById('emailOrPhone');
  if (!inputEl) return;

  const input = inputEl.value.trim();

  if (!input) {
    showAlert('Please enter a valid Gmail or Mobile Number.', 'danger');
    return;
  }

  userTarget = input;

  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: userTarget })
    });

    const data = await response.json();

    if (data.success) {
      showAlert(data.message + (data.debugOtp ? ` (OTP: ${data.debugOtp})` : ''), 'success');
      const step1 = document.getElementById('step-send-otp');
      const step2 = document.getElementById('step-verify-otp');
      if (step1) step1.style.display = 'none';
      if (step2) step2.style.display = 'block';
      
      // Auto-fill debug OTP if debug input exists
      const debugEl = document.getElementById('debugOtpNotice');
      const otpInput = document.getElementById('otpInput');
      if (data.debugOtp) {
        if (debugEl) {
          debugEl.innerText = `[DEBUG MODE] Your 6-Digit OTP is: ${data.debugOtp}`;
          debugEl.style.display = 'block';
        }
        if (otpInput) {
          otpInput.value = data.debugOtp;
        }
      }
    } else {
      showAlert(data.message, 'danger');
    }
  } catch (err) {
    console.error('Send OTP error:', err);
    showAlert('Network error. Failed to send OTP.', 'danger');
  }
}

// 2. Verify OTP & Force Browser Navigation
async function handleVerifyOTP() {
  const otpInput = document.getElementById('otpInput');
  if (!otpInput) return;

  const otpValue = otpInput.value.trim();

  if (!otpValue || otpValue.length !== 6) {
    showAlert('Please enter the full 6-digit OTP.', 'danger');
    return;
  }

  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: userTarget || document.getElementById('emailOrPhone')?.value || 'creator@gmail.com',
        otp: otpValue
      })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Verification successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/';
      }, 500);

    } else {
      showAlert(data.message, 'danger');
    }
  } catch (err) {
    console.error('Verify OTP error:', err);
    showAlert('Network error. Failed to verify OTP.', 'danger');
  }
}

// 3. Quick 1-Click Instant Login (No OTP needed for fast testing)
async function handleQuickLogin() {
  const inputEl = document.getElementById('emailOrPhone');
  const target = inputEl ? inputEl.value.trim() || 'creator@gmail.com' : 'creator@gmail.com';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ emailOrPhone: target })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('⚡ Instant Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/';
      }, 400);
    } else {
      showAlert(data.message || 'Login failed.', 'danger');
    }
  } catch (err) {
    console.error('Quick Login error:', err);
    showAlert('Network error during quick login.', 'danger');
  }
}

// Helper to show styled alert messages
function showAlert(msg, type) {
  const alertBox = document.getElementById('auth-alert');
  if (!alertBox) return;
  alertBox.className = `mt-4 p-3.5 rounded-xl text-xs font-semibold border ${
    type === 'success'
      ? 'bg-[#350B42] text-[#39FF14] border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.3)]'
      : 'bg-[#350B42] text-[#FFD2E1] border-[#FF007F] shadow-[0_0_15px_rgba(255,0,127,0.3)]'
  }`;
  alertBox.innerText = msg;
  alertBox.style.display = 'block';
}

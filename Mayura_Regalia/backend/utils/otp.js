const crypto = require('crypto');

// 6-digit numeric one-time code.
function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Store only a keyed hash of the OTP - never the OTP itself.
function hashOtp(phone, otp) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'change-me')
    .update(`${phone}:${otp}`)
    .digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Sends the OTP by SMS.
//  - If Twilio env vars are set, uses Twilio.
//  - Otherwise (local development) prints the OTP in the server console.
//    In production with no SMS provider configured it throws, so a reset
//    never silently "succeeds" without the customer receiving a code.
// To use another provider (MSG91, Fast2SMS, etc.) just replace the body of
// the Twilio block below.
async function sendOtpSms(phone, otp) {
  const message = `${otp} is your Mayura Regalia password reset code. It is valid for 10 minutes. Do not share it with anyone.`;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
    const to = phone.startsWith('+') ? phone : `${process.env.SMS_DEFAULT_COUNTRY_CODE || '+91'}${phone}`;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: message }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`SMS provider error ${res.status}: ${text}`);
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Password reset OTP for ${phone}: ${otp}`);
    return;
  }
  throw new Error('No SMS provider configured (set TWILIO_* env vars)');
}

module.exports = { generateOtp, hashOtp, safeEqual, sendOtpSms };

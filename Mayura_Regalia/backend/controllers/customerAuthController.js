const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const customerModel = require('../models/customerModel');
const orderModel = require('../models/orderModel');
const { generateOtp, hashOtp, safeEqual, sendOtpSms } = require('../utils/otp');

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

function signToken(customer) {
  return jwt.sign(
    { id: customer.id, phone: customer.phone, name: customer.name, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

function publicCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: (customer.email || '').endsWith('@customer.mayuraregalia.local') ? '' : customer.email,
    shippingAddress: customer.address || '',
  };
}

async function signup(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');
    const shippingAddress = String(req.body.shippingAddress || '').trim();

    if (!name || !phone || !password || !shippingAddress) {
      return res.status(400).json({ message: 'Name, phone number, password and shipping address are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await customerModel.findOrCreateForSignup({ name, phone, passwordHash, shippingAddress });

    if (result.conflict) {
      return res.status(409).json({ message: 'An account with this phone number already exists. Please login instead.' });
    }

    const token = signToken(result.customer);
    res.status(201).json({ message: 'Account created successfully', token, customer: publicCustomer(result.customer) });
  } catch (error) {
    console.error('Customer signup error:', error);
    res.status(500).json({ message: 'Unable to create your account right now' });
  }
}

async function login(req, res) {
  try {
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    const customer = await customerModel.findByPhone(phone);
    if (!customer || !customer.passwordHash) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }
    if (customer.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }

    const token = signToken(customer);
    res.json({ message: 'Login successful', token, customer: publicCustomer(customer) });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ message: 'Unable to login right now' });
  }
}

async function me(req, res) {
  try {
    const customer = await customerModel.findById(req.customer.id);
    if (!customer) return res.status(404).json({ message: 'Account not found' });
    res.json(publicCustomer(customer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load your account' });
  }
}

// Order history for the logged-in customer only - never another customer's
// orders. Defaults to the last 6 months; pass ?range=all for the full history.
async function myOrders(req, res) {
  try {
    const months = req.query.range === 'all' ? null : 6;
    const orders = await orderModel.findByCustomerId(req.customer.id, months ? { months } : {});
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load your orders' });
  }
}

// Step 1 of "Forgot password": send a 6-digit OTP to the customer's phone.
// The response is always the same whether or not the phone is registered, so
// this endpoint can't be used to find out which numbers have accounts.
async function forgotPassword(req, res) {
  const genericReply = { message: 'If an account exists for this phone number, a verification code has been sent.' };
  try {
    const phone = String(req.body.phone || '').trim();
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const customer = await customerModel.findResetState(phone);
    if (!customer || customer.status === 'blocked') return res.json(genericReply);

    const since = await customerModel.secondsSinceOtpSent(customer.id);
    if (since !== null && since < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = OTP_RESEND_COOLDOWN_SECONDS - since;
      return res.status(429).json({ message: `Please wait ${wait} seconds before requesting another code.` });
    }

    const otp = generateOtp();
    await customerModel.saveResetOtp(customer.id, hashOtp(phone, otp), OTP_TTL_MINUTES);
    try {
      await sendOtpSms(phone, otp);
    } catch (smsError) {
      await customerModel.clearResetOtp(customer.id);
      console.error('Failed to send reset OTP:', smsError);
      return res.status(500).json({ message: 'Unable to send the verification code right now. Please try again later.' });
    }

    res.json(genericReply);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Unable to process your request right now' });
  }
}

// Step 2: verify the OTP and set a new password.
async function resetPassword(req, res) {
  try {
    const phone = String(req.body.phone || '').trim();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');
    const invalid = { message: 'Invalid or expired verification code' };

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ message: 'Phone number, verification code and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const customer = await customerModel.findResetState(phone);
    if (!customer || customer.status === 'blocked' || !customer.otpHash) {
      return res.status(400).json(invalid);
    }
    if (!(await customerModel.isResetOtpValidNow(customer.id))) {
      await customerModel.clearResetOtp(customer.id);
      return res.status(400).json(invalid);
    }
    if (Number(customer.otpAttempts) >= OTP_MAX_ATTEMPTS) {
      await customerModel.clearResetOtp(customer.id);
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (!safeEqual(customer.otpHash, hashOtp(phone, otp))) {
      await customerModel.bumpResetAttempts(customer.id);
      return res.status(400).json(invalid);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await customerModel.setPasswordAndClearOtp(customer.id, passwordHash);
    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Unable to reset your password right now' });
  }
}

module.exports = { signup, login, me, myOrders, forgotPassword, resetPassword };

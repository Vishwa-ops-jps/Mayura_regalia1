const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const customerModel = require('../models/customerModel');
const orderModel = require('../models/orderModel');
const { getPool } = require('../config/db');
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
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    pincode: customer.pincode || '',
  };
}

async function signup(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');
    const address = String(req.body.address || '').trim();
    const city = String(req.body.city || '').trim();
    const state = String(req.body.state || '').trim();
    const pincode = String(req.body.pincode || '').trim();

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone number and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Please add your complete shipping address' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await customerModel.findOrCreateForSignup({
      name, phone, passwordHash, address, city, state, pincode,
    });

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

// Customer cancels their own order. Only allowed when order status is
// 'pending' or 'processing'. This writes a note into order_status_history
// and updates the order row — it does NOT touch admin order management.
async function cancelOrder(req, res) {
  try {
    const orderId = Number(req.params.id);
    // Security: fetch the order and verify it belongs to this customer.
    const order = await orderModel.findById(orderId);
    if (!order || order.customerId !== req.customer.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const cancellable = ['pending', 'processing'];
    if (!cancellable.includes(order.orderStatus)) {
      return res.status(400).json({ message: `Orders can only be cancelled when they are pending or in processing. Current status: ${order.orderStatus}.` });
    }
    const updated = await orderModel.updateStatus(orderId, { orderStatus: 'cancelled' });
    res.json(updated);
  } catch (error) {
    console.error('Customer cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order. Please try again.' });
  }
}

// Customer requests a return or replacement. Only allowed when:
//   - Order status is 'delivered'
//   - Request is made within 10 days of delivery (we use updated_at as the
//     delivered-at timestamp since the status-change timestamp is stored there).
// The request is stored in a dedicated order_return_requests table.
async function requestReturn(req, res) {
  try {
    const orderId = Number(req.params.id);
    const requestType = String(req.body.type || '').trim().toLowerCase(); // 'return' or 'replace'
    const reason = String(req.body.reason || '').trim().slice(0, 500);

    if (!['return', 'replace'].includes(requestType)) {
      return res.status(400).json({ message: "Type must be 'return' or 'replace'" });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for your request.' });
    }

    // Security: fetch the order and verify it belongs to this customer.
    const order = await orderModel.findById(orderId);
    if (!order || order.customerId !== req.customer.id) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ message: 'Return or replacement can only be requested for delivered orders.' });
    }

    // Check 10-day eligibility window using the order's updatedAt (last status change).
    const deliveredAt = new Date(order.updatedAt);
    const daysSinceDelivery = Math.floor((Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 10) {
      return res.status(400).json({ message: 'The 10-day return/replacement window for this order has expired.' });
    }

    const pool = getPool();
    // Check for an existing pending request on this order.
    const [existing] = await pool.query(
      'SELECT id FROM order_return_requests WHERE order_id = ? AND status = \'pending\' LIMIT 1',
      [orderId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A return/replacement request for this order is already under review.' });
    }

    // Ensure the return requests table exists (created lazily so no migration is needed).
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_return_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        customer_id INT NOT NULL,
        type ENUM('return','replace') NOT NULL,
        reason TEXT,
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (order_id),
        INDEX (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [result] = await pool.query(
      `INSERT INTO order_return_requests (order_id, customer_id, type, reason) VALUES (?, ?, ?, ?)`,
      [orderId, req.customer.id, requestType, reason]
    );

    res.status(201).json({
      id: result.insertId,
      orderId,
      type: requestType,
      reason,
      status: 'pending',
      message: `Your ${requestType} request has been submitted and is under review.`,
    });
  } catch (error) {
    console.error('Customer return/replace request error:', error);
    res.status(500).json({ message: 'Failed to submit request. Please try again.' });
  }
}

module.exports = { signup, login, me, myOrders, forgotPassword, resetPassword, cancelOrder, requestReturn };

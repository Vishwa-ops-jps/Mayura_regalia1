const { getPool } = require('../config/db');

const DEFAULTS = {
  storeName: 'Mayura Regalia',
  storeEmail: 'support@mayuraregalia.com',
  storePhone: '',
  address: '',
  currency: 'INR',
  shippingFee: '0',
  freeShippingThreshold: '999',
  taxRate: '0',
  socialInstagram: '',
  socialFacebook: '',
  maintenanceMode: 'false',
  apiKeyPublic: '',
  apiKeySecret: '',
  apiKeyCreatedAt: '',
  // Payment gateway (Razorpay handles cards, UPI, netbanking & wallets
  // through one integration). Admin pastes these in from their Razorpay
  // dashboard - see admin Settings > Payment Gateway.
  codEnabled: 'true',
  razorpayEnabled: 'false',
  razorpayKeyId: '',
  razorpayKeySecret: '',
  razorpayWebhookSecret: '',
  // Direct UPI: a second, gateway-free way to collect UPI payments straight
  // into the admin's own bank account via a UPI deep link / QR code, for
  // stores that want a fallback (or don't have Razorpay set up at all).
  // There's no aggregator in this path, so there's also no automatic
  // verification - the admin has to confirm each payment themselves in the
  // Payments screen after checking their UPI app or bank statement.
  directUpiEnabled: 'false',
  // The admin's own UPI ID (VPA). Used both as a trust-signal display at
  // checkout AND, when directUpiEnabled is on, as the actual payee address
  // encoded into the UPI deep link/QR that customers pay - money for that
  // path goes straight to whichever bank account this UPI ID is linked to.
  upiId: '',
};

async function getAll() {
  const [rows] = await getPool().query('SELECT setting_key AS `key`, setting_value AS value FROM settings');
  const result = { ...DEFAULTS };
  rows.forEach((row) => { result[row.key] = row.value; });
  return result;
}

async function updateMany(values) {
  const pool = getPool();
  const entries = Object.entries(values || {});
  for (const [key, value] of entries) {
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value == null ? '' : String(value)]
    );
  }
  return getAll();
}

module.exports = { getAll, updateMany, DEFAULTS };

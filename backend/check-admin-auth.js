// Usage (from the backend folder): node check-admin-auth.js
// Confirms JWT_SECRET loads from .env and that a token signed with it verifies.
// The short fingerprint lets you compare two backend instances/folders:
// if they print different fingerprints, tokens from one are rejected by the other.
require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is NOT set. Admin tokens cannot be verified. Check backend/.env');
  process.exit(1);
}
const fingerprint = crypto.createHash('sha256').update(secret).digest('hex').slice(0, 8);
console.log(`JWT_SECRET loaded (length ${secret.length}, fingerprint ${fingerprint})`);
console.log(`JWT_EXPIRES_IN = ${process.env.JWT_EXPIRES_IN || '7d (default)'}`);

const token = jwt.sign({ role: 'admin', test: true }, secret, { expiresIn: '1m' });
try {
  jwt.verify(token, secret);
  console.log('Sign + verify round trip: OK');
} catch (e) {
  console.error('Sign + verify failed:', e.message);
  process.exit(1);
}

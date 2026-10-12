const { getPool } = require('../config/db');

const fields = `id, name, email, phone, address, city, state, pincode,
  total_orders AS totalOrders, total_spent AS totalSpent, status,
  created_at AS createdAt, updated_at AS updatedAt`;

async function findAll({ search } = {}) {
  let sql = `SELECT ${fields} FROM customers`;
  const params = [];
  if (search) {
    sql += ' WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  sql += ' ORDER BY id DESC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM customers WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM customers WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await getPool().query(
    `INSERT INTO customers (name, email, phone, address, city, state, pincode, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.email, data.phone || null, data.address || null, data.city || null, data.state || null, data.pincode || null, data.status || 'active']
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const [result] = await getPool().query(
    `UPDATE customers SET name=?, email=?, phone=?, address=?, city=?, state=?, pincode=?, status=? WHERE id=?`,
    [data.name, data.email, data.phone || null, data.address || null, data.city || null, data.state || null, data.pincode || null, data.status || 'active', id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM customers WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Creates the customer if new, otherwise bumps their order stats. Used at checkout time.
async function upsertFromOrder({ name, email, phone, address, city, state, pincode, orderTotal }) {
  if (!email) return null;
  const existing = await findByEmail(email);
  if (existing) {
    await getPool().query(
      `UPDATE customers SET name=?, phone=COALESCE(?, phone), address=COALESCE(?, address),
       city=COALESCE(?, city), state=COALESCE(?, state), pincode=COALESCE(?, pincode),
       total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id=?`,
      [name || existing.name, phone, address, city, state, pincode, Number(orderTotal || 0), existing.id]
    );
    return findById(existing.id);
  }
  const [result] = await getPool().query(
    `INSERT INTO customers (name, email, phone, address, city, state, pincode, total_orders, total_spent, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'active')`,
    [name, email, phone || null, address || null, city || null, state || null, pincode || null, Number(orderTotal || 0)]
  );
  return findById(result.insertId);
}

// --- Customer portal (self sign-up / login) helpers below. These are additive
// and do not change any of the admin-facing behaviour above. ---

async function findByPhone(phone) {
  const [rows] = await getPool().query(
    `SELECT ${fields}, password_hash AS passwordHash FROM customers WHERE phone = ? LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
}

// Registers a brand-new customer portal account. If a customer record
// already exists for this phone (e.g. created earlier via guest checkout or
// the admin panel) and has no password yet, it "claims" that record instead
// of creating a duplicate, so their existing order history stays linked.
async function findOrCreateForSignup({ name, phone, passwordHash, address, city, state, pincode }) {
  const existing = await findByPhone(phone);
  if (existing) {
    if (existing.passwordHash) {
      return { conflict: true, customer: null };
    }
    await getPool().query(
      `UPDATE customers SET name = COALESCE(?, name), password_hash = ?,
       address = COALESCE(?, address), city = COALESCE(?, city),
       state = COALESCE(?, state), pincode = COALESCE(?, pincode) WHERE id = ?`,
      [name || null, passwordHash, address || null, city || null, state || null, pincode || null, existing.id]
    );
    return { conflict: false, customer: await findById(existing.id) };
  }

  const placeholderEmail = `${phone}@customer.mayuraregalia.local`;
  const [result] = await getPool().query(
    `INSERT INTO customers (name, email, phone, address, city, state, pincode, password_hash, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [name, placeholderEmail, phone, address || null, city || null, state || null, pincode || null, passwordHash]
  );
  return { conflict: false, customer: await findById(result.insertId) };
}

// Links a placed order to an already-logged-in customer account and bumps
// their stats, instead of matching by email (used for guest checkout).
async function attachOrderToCustomer(id, { name, phone, address, city, state, pincode, orderTotal }) {
  await getPool().query(
    `UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address),
     city = COALESCE(?, city), state = COALESCE(?, state), pincode = COALESCE(?, pincode),
     total_orders = total_orders + 1, total_spent = total_spent + ? WHERE id = ?`,
    [name || null, phone || null, address || null, city || null, state || null, pincode || null, Number(orderTotal || 0), id]
  );
  return findById(id);
}

// --- Forgot password (OTP) helpers ---

async function findResetState(phone) {
  const [rows] = await getPool().query(
    `SELECT id, status, reset_otp_hash AS otpHash, reset_otp_expires AS otpExpires,
            reset_otp_attempts AS otpAttempts, reset_otp_sent_at AS otpSentAt
     FROM customers WHERE phone = ? LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
}

async function saveResetOtp(id, otpHash, ttlMinutes) {
  await getPool().query(
    `UPDATE customers SET reset_otp_hash = ?, reset_otp_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE),
     reset_otp_attempts = 0, reset_otp_sent_at = NOW() WHERE id = ?`,
    [otpHash, ttlMinutes, id]
  );
}

async function bumpResetAttempts(id) {
  await getPool().query('UPDATE customers SET reset_otp_attempts = reset_otp_attempts + 1 WHERE id = ?', [id]);
}

async function clearResetOtp(id) {
  await getPool().query(
    `UPDATE customers SET reset_otp_hash = NULL, reset_otp_expires = NULL,
     reset_otp_attempts = 0, reset_otp_sent_at = NULL WHERE id = ?`,
    [id]
  );
}

async function setPasswordAndClearOtp(id, passwordHash) {
  await getPool().query(
    `UPDATE customers SET password_hash = ?, reset_otp_hash = NULL, reset_otp_expires = NULL,
     reset_otp_attempts = 0, reset_otp_sent_at = NULL WHERE id = ?`,
    [passwordHash, id]
  );
}

// True when the stored OTP has not expired yet (compared in the DB clock).
async function isResetOtpValidNow(id) {
  const [rows] = await getPool().query(
    'SELECT (reset_otp_expires IS NOT NULL AND reset_otp_expires > NOW()) AS valid FROM customers WHERE id = ?',
    [id]
  );
  return Boolean(rows[0] && Number(rows[0].valid));
}

// Seconds since the last OTP was sent (null if never).
async function secondsSinceOtpSent(id) {
  const [rows] = await getPool().query(
    'SELECT TIMESTAMPDIFF(SECOND, reset_otp_sent_at, NOW()) AS secs FROM customers WHERE id = ?',
    [id]
  );
  const v = rows[0] ? rows[0].secs : null;
  return v === null || v === undefined ? null : Number(v);
}

module.exports = {
  findResetState, saveResetOtp, bumpResetAttempts, clearResetOtp,
  setPasswordAndClearOtp, isResetOtpValidNow, secondsSinceOtpSent,
  findAll, findById, findByEmail, create, update, remove, upsertFromOrder,
  findByPhone, findOrCreateForSignup, attachOrderToCustomer,
};

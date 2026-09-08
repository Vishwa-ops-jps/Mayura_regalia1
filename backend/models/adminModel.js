const { getPool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await getPool().query(
    'SELECT id, name, email, password_hash, role FROM admins WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function createAdmin({ name, email, passwordHash }) {
  const [result] = await getPool().query(
    'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash]
  );
  return { id: result.insertId, name, email, role: 'admin' };
}

module.exports = { findByEmail, createAdmin };

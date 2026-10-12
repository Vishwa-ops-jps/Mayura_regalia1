const { getPool } = require('../config/db');

async function findByCustomer(customerId) {
  const [rows] = await getPool().query(
    `SELECT id, customer_id AS customerId, label, address, city, state, pincode, is_default AS isDefault, created_at AS createdAt
     FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id ASC`,
    [customerId]
  );
  return rows;
}

async function findById(id, customerId) {
  const [rows] = await getPool().query(
    `SELECT id, customer_id AS customerId, label, address, city, state, pincode, is_default AS isDefault, created_at AS createdAt
     FROM customer_addresses WHERE id = ? AND customer_id = ? LIMIT 1`,
    [id, customerId]
  );
  return rows[0] || null;
}

async function create(customerId, { label, address, city, state, pincode, isDefault }) {
  // If this is the first address or is_default requested, clear other defaults first
  if (isDefault) {
    await getPool().query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [customerId]);
  }
  const [result] = await getPool().query(
    `INSERT INTO customer_addresses (customer_id, label, address, city, state, pincode, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [customerId, label || 'Home', address, city, state, pincode, isDefault ? 1 : 0]
  );
  return findById(result.insertId, customerId);
}

async function update(id, customerId, { label, address, city, state, pincode, isDefault }) {
  if (isDefault) {
    await getPool().query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [customerId]);
  }
  await getPool().query(
    `UPDATE customer_addresses SET label=?, address=?, city=?, state=?, pincode=?, is_default=?
     WHERE id=? AND customer_id=?`,
    [label || 'Home', address, city, state, pincode, isDefault ? 1 : 0, id, customerId]
  );
  return findById(id, customerId);
}

async function remove(id, customerId) {
  const [result] = await getPool().query(
    'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?',
    [id, customerId]
  );
  return result.affectedRows > 0;
}

async function setDefault(id, customerId) {
  await getPool().query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?', [customerId]);
  await getPool().query('UPDATE customer_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?', [id, customerId]);
  return findById(id, customerId);
}

// Ensure every customer has at most 5 addresses
async function count(customerId) {
  const [rows] = await getPool().query('SELECT COUNT(*) AS n FROM customer_addresses WHERE customer_id = ?', [customerId]);
  return Number(rows[0].n);
}

module.exports = { findByCustomer, findById, create, update, remove, setDefault, count };

const { getPool } = require('../config/db');

const fields = `id, product_id AS productId, product_name AS productName, customer_name AS customerName,
  email, rating, comment, status, created_at AS createdAt, updated_at AS updatedAt`;

async function findAll({ status } = {}) {
  let sql = `SELECT ${fields} FROM reviews`;
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM reviews WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await getPool().query(
    `INSERT INTO reviews (product_id, product_name, customer_name, email, rating, comment, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.productId || null, data.productName || null, data.customerName, data.email || null,
      Number(data.rating || 5), data.comment || null, data.status || 'pending']
  );
  return findById(result.insertId);
}

async function updateStatus(id, status) {
  const [result] = await getPool().query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows ? findById(id) : null;
}

async function update(id, data) {
  const [result] = await getPool().query(
    `UPDATE reviews SET product_id=?, product_name=?, customer_name=?, email=?, rating=?, comment=?, status=? WHERE id=?`,
    [data.productId || null, data.productName || null, data.customerName, data.email || null,
      Number(data.rating || 5), data.comment || null, data.status || 'pending', id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM reviews WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, updateStatus, remove };

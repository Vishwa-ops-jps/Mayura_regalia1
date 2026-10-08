const { getPool } = require('../config/db');

const fields = `id, name, description, price, image, status, created_at AS createdAt, updated_at AS updatedAt`;

async function findAll({ status } = {}) {
  let sql = `SELECT ${fields} FROM gifts`;
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY id DESC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM gifts WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await getPool().query(
    `INSERT INTO gifts (name, description, price, image, status) VALUES (?, ?, ?, ?, ?)`,
    [data.name, data.description || null, Number(data.price || 0), data.image || null, data.status || 'active']
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const [result] = await getPool().query(
    `UPDATE gifts SET name=?, description=?, price=?, image=?, status=? WHERE id=?`,
    [data.name, data.description || null, Number(data.price || 0), data.image || null, data.status || 'active', id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM gifts WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };

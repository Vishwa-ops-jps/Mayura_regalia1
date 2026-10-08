const { getPool } = require('../config/db');

const fields = `id, name, slug, description, image, status, sort_order AS sortOrder,
  created_at AS createdAt, updated_at AS updatedAt`;

function slugify(text) {
  return String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function findAll({ status } = {}) {
  let sql = `SELECT ${fields} FROM categories`;
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY sort_order ASC, name ASC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM categories WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const [result] = await getPool().query(
    `INSERT INTO categories (name, slug, description, image, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.name, slug, data.description || null, data.image || null, data.status || 'active', Number(data.sortOrder || 0)]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const [result] = await getPool().query(
    `UPDATE categories SET name=?, slug=?, description=?, image=?, status=?, sort_order=? WHERE id=?`,
    [data.name, slug, data.description || null, data.image || null, data.status || 'active', Number(data.sortOrder || 0), id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove, slugify };

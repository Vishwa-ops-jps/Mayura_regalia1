const { getPool } = require('../config/db');
const { slugify } = require('./categoryModel');

const fields = `id, name, slug, description, image, product_ids AS productIds, status,
  created_at AS createdAt, updated_at AS updatedAt`;

function normalize(row) {
  if (!row) return row;
  let productIds = [];
  try {
    productIds = row.productIds
      ? (Array.isArray(row.productIds) ? row.productIds : JSON.parse(row.productIds))
      : [];
  } catch { productIds = []; }
  return { ...row, productIds };
}

async function findAll({ status } = {}) {
  let sql = `SELECT ${fields} FROM collections`;
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY id DESC';
  const [rows] = await getPool().query(sql, params);
  return rows.map(normalize);
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM collections WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? normalize(rows[0]) : null;
}

async function create(data) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const [result] = await getPool().query(
    `INSERT INTO collections (name, slug, description, image, product_ids, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.name, slug, data.description || null, data.image || null, JSON.stringify(data.productIds || []), data.status || 'active']
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const [result] = await getPool().query(
    `UPDATE collections SET name=?, slug=?, description=?, image=?, product_ids=?, status=? WHERE id=?`,
    [data.name, slug, data.description || null, data.image || null, JSON.stringify(data.productIds || []), data.status || 'active', id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM collections WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };

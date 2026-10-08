const { getPool } = require('../config/db');

const fields = `id, title, subtitle, image, link, position, status, sort_order AS sortOrder,
  created_at AS createdAt, updated_at AS updatedAt`;

async function findAll({ status, position } = {}) {
  let sql = `SELECT ${fields} FROM banners`;
  const params = [];
  const conditions = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (position) { conditions.push('position = ?'); params.push(position); }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY sort_order ASC, id DESC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM banners WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await getPool().query(
    `INSERT INTO banners (title, subtitle, image, link, position, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.subtitle || null, data.image || null, data.link || null, data.position || 'home_hero', data.status || 'active', Number(data.sortOrder || 0)]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const [result] = await getPool().query(
    `UPDATE banners SET title=?, subtitle=?, image=?, link=?, position=?, status=?, sort_order=? WHERE id=?`,
    [data.title, data.subtitle || null, data.image || null, data.link || null, data.position || 'home_hero', data.status || 'active', Number(data.sortOrder || 0), id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM banners WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };

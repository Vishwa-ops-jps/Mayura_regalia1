const { getPool } = require('../config/db');

const fields = `id, code, type, value, min_order_amount AS minOrderAmount, max_discount AS maxDiscount,
  usage_limit AS usageLimit, used_count AS usedCount, status, expires_at AS expiresAt,
  created_at AS createdAt, updated_at AS updatedAt`;

async function findAll() {
  const [rows] = await getPool().query(`SELECT ${fields} FROM coupons ORDER BY id DESC`);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM coupons WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function findByCode(code) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM coupons WHERE code = ? LIMIT 1`, [String(code || '').toUpperCase()]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await getPool().query(
    `INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(data.code || '').toUpperCase(), data.type || 'percentage', Number(data.value || 0),
      Number(data.minOrderAmount || 0), data.maxDiscount === '' || data.maxDiscount == null ? null : Number(data.maxDiscount),
      data.usageLimit === '' || data.usageLimit == null ? null : Number(data.usageLimit),
      data.status || 'active', data.expiresAt || null,
    ]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const [result] = await getPool().query(
    `UPDATE coupons SET code=?, type=?, value=?, min_order_amount=?, max_discount=?, usage_limit=?, status=?, expires_at=? WHERE id=?`,
    [
      String(data.code || '').toUpperCase(), data.type || 'percentage', Number(data.value || 0),
      Number(data.minOrderAmount || 0), data.maxDiscount === '' || data.maxDiscount == null ? null : Number(data.maxDiscount),
      data.usageLimit === '' || data.usageLimit == null ? null : Number(data.usageLimit),
      data.status || 'active', data.expiresAt || null, id,
    ]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM coupons WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function incrementUsage(id) {
  await getPool().query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [id]);
}

module.exports = { findAll, findById, findByCode, create, update, remove, incrementUsage };

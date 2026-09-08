const { getPool } = require('../config/db');

const selectFields = `
  id, name, category, price, original_price AS originalPrice,
  discount, rating, material, color, in_stock AS inStock,
  description, image, created_at AS createdAt, updated_at AS updatedAt
`;

async function findAll({ category, search } = {}) {
  let sql = `SELECT ${selectFields} FROM products`;
  const params = [];
  const conditions = [];

  if (category && category !== 'all') {
    conditions.push('LOWER(category) = LOWER(?)');
    params.push(category);
  }

  if (search) {
    conditions.push('(name LIKE ? OR category LIKE ? OR description LIKE ? OR material LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY id ASC';

  const [rows] = await getPool().query(sql, params);
  return rows.map(normalizeProduct);
}

async function findById(id) {
  const [rows] = await getPool().query(
    `SELECT ${selectFields} FROM products WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ? normalizeProduct(rows[0]) : null;
}

async function create(product) {
  const [result] = await getPool().query(
    `INSERT INTO products
      (name, category, price, original_price, discount, rating, material, color, in_stock, description, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values(product)
  );
  return findById(result.insertId);
}

async function update(id, product) {
  const [result] = await getPool().query(
    `UPDATE products SET
      name=?, category=?, price=?, original_price=?, discount=?, rating=?, material=?, color=?,
      in_stock=?, description=?, image=?
     WHERE id=?`,
    [...values(product), id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

function values(product) {
  return [
    product.name,
    product.category,
    Number(product.price),
    product.originalPrice === '' || product.originalPrice == null ? null : Number(product.originalPrice),
    Number(product.discount || 0),
    Number(product.rating || 0),
    product.material || null,
    product.color || null,
    product.inStock ? 1 : 0,
    product.description || null,
    product.image || null,
  ];
}

function normalizeProduct(row) {
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price),
    originalPrice: row.originalPrice == null ? null : Number(row.originalPrice),
    discount: Number(row.discount),
    rating: Number(row.rating),
    inStock: Boolean(row.inStock),
  };
}

module.exports = { findAll, findById, create, update, remove };

const { getPool } = require('../config/db');

// Same shape as productModel's list queries so the storefront can render
// wishlist items with the normal ProductCard.
const productFields = `
  p.id, p.name, p.category, p.price, p.original_price AS originalPrice,
  p.discount, p.rating, p.material, p.color, p.colors, p.in_stock AS inStock,
  p.description, p.image, p.sku, p.stock_quantity AS stockQuantity
`;

function normalize(row) {
  let colors = row.colors;
  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch { colors = colors ? [colors] : []; }
  }
  if (!Array.isArray(colors)) colors = colors ? [colors] : (row.color ? [row.color] : []);
  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price),
    originalPrice: row.originalPrice == null ? null : Number(row.originalPrice),
    discount: Number(row.discount),
    rating: Number(row.rating),
    inStock: Boolean(row.inStock),
    colors,
  };
}

async function listForCustomer(customerId) {
  const [rows] = await getPool().query(
    `SELECT ${productFields}
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
      WHERE w.customer_id = ?
      ORDER BY w.created_at DESC, w.id DESC`,
    [customerId]
  );
  return rows.map(normalize);
}

async function idsForCustomer(customerId) {
  const [rows] = await getPool().query(
    'SELECT product_id FROM wishlists WHERE customer_id = ?',
    [customerId]
  );
  return rows.map((r) => Number(r.product_id));
}

async function add(customerId, productId) {
  // INSERT IGNORE + the UNIQUE key makes adding twice a harmless no-op.
  await getPool().query(
    'INSERT IGNORE INTO wishlists (customer_id, product_id) VALUES (?, ?)',
    [customerId, productId]
  );
}

async function remove(customerId, productId) {
  await getPool().query(
    'DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?',
    [customerId, productId]
  );
}

async function productExists(productId) {
  const [rows] = await getPool().query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
  return rows.length > 0;
}

module.exports = { listForCustomer, idsForCustomer, add, remove, productExists };

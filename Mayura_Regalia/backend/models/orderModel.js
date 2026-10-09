const { getPool } = require('../config/db');
const customerModel = require('./customerModel');
const paymentModel = require('./paymentModel');

const orderFields = `id, order_number AS orderNumber, customer_id AS customerId, customer_name AS customerName,
  email, phone, address, city, state, pincode, subtotal, discount, shipping_fee AS shippingFee, total,
  coupon_code AS couponCode, payment_method AS paymentMethod, payment_status AS paymentStatus,
  order_status AS orderStatus, courier_name AS courierName, tracking_number AS trackingNumber,
  tracking_url AS trackingUrl, created_at AS createdAt, updated_at AS updatedAt`;

const itemFields = `id, order_id AS orderId, product_id AS productId, product_name AS productName,
  image, price, quantity, subtotal`;

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000 + 10000);
  return `MR-${year}-${rand}`;
}

async function attachItems(order) {
  if (!order) return order;
  const [items] = await getPool().query(`SELECT ${itemFields} FROM order_items WHERE order_id = ?`, [order.id]);
  return { ...order, items };
}

async function findAll({ status, search } = {}) {
  let sql = `SELECT ${orderFields} FROM orders`;
  const params = [];
  const conditions = [];
  if (status) { conditions.push('order_status = ?'); params.push(status); }
  if (search) {
    conditions.push('(order_number LIKE ? OR customer_name LIKE ? OR email LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY id DESC';
  const [rows] = await getPool().query(sql, params);
  return Promise.all(rows.map(attachItems));
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${orderFields} FROM orders WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? attachItems(rows[0]) : null;
}

async function findByOrderNumber(orderNumber) {
  const [rows] = await getPool().query(`SELECT ${orderFields} FROM orders WHERE order_number = ? LIMIT 1`, [orderNumber]);
  return rows[0] ? attachItems(rows[0]) : null;
}

async function create(data) {
  const pool = getPool();
  const orderNumber = data.orderNumber || generateOrderNumber();
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
  const discount = Number(data.discount || 0);
  const shippingFee = Number(data.shippingFee || 0);
  const total = data.total != null ? Number(data.total) : Math.max(0, subtotal - discount + shippingFee);

  // If this order was placed by a logged-in customer portal account, link it
  // straight to that account instead of matching/creating by email, so it
  // always shows up in their own order history. Guest checkout (no
  // customerId) keeps working exactly as before.
  const customer = data.customerId
    ? await customerModel.attachOrderToCustomer(data.customerId, {
        name: data.customerName, phone: data.phone, address: data.address,
        city: data.city, state: data.state, pincode: data.pincode, orderTotal: total,
      })
    : await customerModel.upsertFromOrder({
        name: data.customerName, email: data.email, phone: data.phone, address: data.address,
        city: data.city, state: data.state, pincode: data.pincode, orderTotal: total,
      });

  const [result] = await pool.query(
    `INSERT INTO orders (order_number, customer_id, customer_name, email, phone, address, city, state, pincode,
      subtotal, discount, shipping_fee, total, coupon_code, payment_method, payment_status, order_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderNumber, customer ? customer.id : null, data.customerName, data.email || null, data.phone || null,
      data.address || null, data.city || null, data.state || null, data.pincode || null,
      subtotal, discount, shippingFee, total, data.couponCode || null,
      data.paymentMethod || 'COD', data.paymentStatus || 'pending', data.orderStatus || 'pending',
    ]
  );

  const orderId = result.insertId;
  await pool.query('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)', [orderId, data.orderStatus || 'pending']);
  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, image, price, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, item.productId || item.id || null, item.name || item.productName,
        item.image || null, Number(item.price || 0), Number(item.quantity || 1),
        Number(item.price || 0) * Number(item.quantity || 1),
      ]
    );
  }

  await paymentModel.create({
    orderId, orderNumber, customerName: data.customerName, amount: total,
    method: data.paymentMethod || 'COD', status: data.paymentMethod === 'COD' ? 'pending' : (data.paymentStatus || 'pending'),
  });

  return findById(orderId);
}

async function updateStatus(id, { orderStatus, paymentStatus, courierName, trackingNumber, trackingUrl }) {
  const pool = getPool();
  const sets = [];
  const params = [];
  if (orderStatus) { sets.push('order_status = ?'); params.push(orderStatus); }
  if (paymentStatus) { sets.push('payment_status = ?'); params.push(paymentStatus); }
  if (courierName !== undefined) { sets.push('courier_name = ?'); params.push(String(courierName || '').trim().slice(0, 120) || null); }
  if (trackingNumber !== undefined) { sets.push('tracking_number = ?'); params.push(String(trackingNumber || '').trim().slice(0, 120) || null); }
  if (trackingUrl !== undefined) {
    const url = String(trackingUrl || '').trim().slice(0, 500);
    sets.push('tracking_url = ?');
    params.push(/^https?:\/\//i.test(url) ? url : null); // only real web links
  }
  if (!sets.length) return findById(id);
  params.push(id);
  await pool.query(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, params);
  if (orderStatus) {
    await pool.query('INSERT INTO order_status_history (order_id, status) VALUES (?, ?)', [id, orderStatus]);
  }
  if (paymentStatus) {
    await pool.query('UPDATE payments SET status = ? WHERE order_id = ?', [paymentStatus, id]);
  }
  return findById(id);
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Order history for a logged-in customer portal account. Scoped strictly to
// their own customer_id - one customer can never see another's orders.
async function findByCustomerId(customerId, { months } = {}) {
  let sql = `SELECT ${orderFields} FROM orders WHERE customer_id = ?`;
  const params = [customerId];
  if (months) {
    sql += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)';
    params.push(months);
  }
  sql += ' ORDER BY id DESC';
  const [rows] = await getPool().query(sql, params);
  return Promise.all(rows.map(attachItems));
}

async function getStatusHistory(orderId) {
  const [rows] = await getPool().query(
    'SELECT status, created_at AS at FROM order_status_history WHERE order_id = ? ORDER BY id ASC', [orderId]
  );
  return rows;
}

async function findReturnRequests({ status, search } = {}) {
  let sql = `SELECT r.id, r.order_id AS orderId, r.customer_id AS customerId,
    r.type, r.reason, r.status, r.admin_note AS adminNote,
    r.created_at AS createdAt, r.updated_at AS updatedAt,
    o.order_number AS orderNumber, o.total, o.payment_status AS paymentStatus,
    o.order_status AS orderStatus, o.customer_name AS customerName, o.email, o.phone
    FROM order_return_requests r JOIN orders o ON o.id = r.order_id`;
  const params = [];
  const conditions = [];
  if (status) { conditions.push('r.status = ?'); params.push(status); }
  if (search) {
    conditions.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.email LIKE ?)');
    const query = `%${search}%`;
    params.push(query, query, query);
  }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY r.id DESC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function updateReturnRequest(id, { status, adminNote }) {
  const pool = getPool();
  const sets = [];
  const params = [];
  if (status) { sets.push('status = ?'); params.push(status); }
  if (adminNote !== undefined) { sets.push('admin_note = ?'); params.push(String(adminNote || '').trim().slice(0, 1000) || null); }
  if (!sets.length) return null;
  params.push(id);
  const [result] = await pool.query(`UPDATE order_return_requests SET ${sets.join(', ')} WHERE id = ?`, params);
  if (!result.affectedRows) return null;
  const [rows] = await pool.query(
    `SELECT r.id, r.order_id AS orderId, r.customer_id AS customerId, r.type, r.reason,
      r.status, r.admin_note AS adminNote, r.created_at AS createdAt, r.updated_at AS updatedAt,
      o.order_number AS orderNumber, o.total, o.payment_status AS paymentStatus,
      o.order_status AS orderStatus, o.customer_name AS customerName, o.email, o.phone
      FROM order_return_requests r JOIN orders o ON o.id = r.order_id WHERE r.id = ?`, [id]
  );
  return rows[0] || null;
}

// Public order tracking: the order number alone is guessable, so the caller must also give the
// email or phone used at checkout. Returns only non-sensitive fields (no full street address).
async function findForTracking(orderNumber, contact) {
  const order = await findByOrderNumber(String(orderNumber || '').trim().toUpperCase());
  if (!order) return null;
  const given = String(contact || '').trim().toLowerCase();
  if (!given) return null;
  const emailMatch = given.includes('@') && order.email && order.email.toLowerCase() === given;
  const digits = (v) => String(v || '').replace(/\D/g, '').slice(-10);
  const phoneMatch = !given.includes('@') && digits(given).length >= 10 && digits(order.phone) === digits(given);
  if (!emailMatch && !phoneMatch) return null;
  const history = await getStatusHistory(order.id);
  return {
    orderNumber: order.orderNumber, orderStatus: order.orderStatus, paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod, createdAt: order.createdAt, updatedAt: order.updatedAt,
    city: order.city, state: order.state, subtotal: order.subtotal, discount: order.discount,
    shippingFee: order.shippingFee, total: order.total, courierName: order.courierName,
    trackingNumber: order.trackingNumber, trackingUrl: order.trackingUrl, history,
    items: (order.items || []).map((i) => ({ productName: i.productName, image: i.image, price: i.price, quantity: i.quantity })),
  };
}

module.exports = { findAll, findById, findByOrderNumber, findByCustomerId, findForTracking, getStatusHistory, findReturnRequests, updateReturnRequest, create, updateStatus, remove, generateOrderNumber };

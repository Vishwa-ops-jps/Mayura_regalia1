const { getPool } = require('../config/db');

const fields = `id, order_id AS orderId, order_number AS orderNumber, customer_name AS customerName,
  amount, method, status, transaction_id AS transactionId, gateway_order_id AS gatewayOrderId,
  proof_image AS proofImage, created_at AS createdAt, updated_at AS updatedAt`;

async function findAll({ status } = {}) {
  let sql = `SELECT ${fields} FROM payments`;
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY id DESC';
  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM payments WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

// Every order gets exactly one payment row created alongside it (see
// orderModel.create), so "the payment for this order" is just the latest
// one by order_id.
async function findByOrderId(orderId) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`, [orderId]);
  return rows[0] || null;
}

async function findByGatewayOrderId(gatewayOrderId) {
  const [rows] = await getPool().query(`SELECT ${fields} FROM payments WHERE gateway_order_id = ? LIMIT 1`, [gatewayOrderId]);
  return rows[0] || null;
}

async function create(data) {
  const [result] = await getPool().query(
    `INSERT INTO payments (order_id, order_number, customer_name, amount, method, status, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.orderId, data.orderNumber, data.customerName || null, Number(data.amount || 0),
      data.method || 'COD', data.status || 'pending', data.transactionId || null]
  );
  return findById(result.insertId);
}

async function updateStatus(id, status, transactionId) {
  const pool = getPool();
  if (transactionId) {
    await pool.query('UPDATE payments SET status = ?, transaction_id = ? WHERE id = ?', [status, transactionId, id]);
  } else {
    await pool.query('UPDATE payments SET status = ? WHERE id = ?', [status, id]);
  }
  const payment = await findById(id);
  if (payment) {
    await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [status, payment.orderId]);
  }
  return payment;
}

// Called right after we create a Razorpay order for an existing (pending)
// order, so the later verify/webhook call can find its way back to this
// order by gateway_order_id alone.
async function setGatewayOrderId(orderId, gatewayOrderId) {
  await getPool().query('UPDATE payments SET gateway_order_id = ? WHERE order_id = ?', [gatewayOrderId, orderId]);
  return findByOrderId(orderId);
}

// Marks the payment (and its order) paid once the gateway signature has
// been verified. `method` is the actual instrument used - card / upi /
// netbanking / wallet - fetched from Razorpay after verification, so the
// admin Payments table shows something more useful than just "Online".
async function markPaid(orderId, { transactionId, method } = {}) {
  const payment = await findByOrderId(orderId);
  if (!payment) return null;
  const pool = getPool();
  const sets = ['status = ?'];
  const params = ['paid'];
  if (transactionId) { sets.push('transaction_id = ?'); params.push(transactionId); }
  if (method) { sets.push('method = ?'); params.push(method); }
  params.push(payment.id);
  await pool.query(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`, params);
  await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['paid', orderId]);
  return findByOrderId(orderId);
}

// Direct UPI has no gateway to verify a signature with, so this is the only
// evidence tying a customer's payment to this order: whatever UTR/reference
// number they saw in their UPI app after paying. Status stays 'pending' -
// the admin still has to check their own bank/UPI app and flip it to paid
// from the existing Payments screen; this just gives them something to
// cross-check against instead of a blank "pending" row.
async function recordReference(orderId, transactionId, proofImage) {
  const payment = await findByOrderId(orderId);
  if (!payment) return null;
  const sets = ['transaction_id = ?'];
  const params = [transactionId];
  if (proofImage) { sets.push('proof_image = ?'); params.push(proofImage); }
  params.push(payment.id);
  await getPool().query(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`, params);
  return findByOrderId(orderId);
}

async function markFailed(orderId) {
  const payment = await findByOrderId(orderId);
  if (!payment) return null;
  await getPool().query('UPDATE payments SET status = ? WHERE id = ?', ['failed', payment.id]);
  await getPool().query('UPDATE orders SET payment_status = ? WHERE id = ?', ['failed', orderId]);
  return findByOrderId(orderId);
}

module.exports = {
  findAll, findById, findByOrderId, findByGatewayOrderId, create, updateStatus,
  setGatewayOrderId, markPaid, markFailed, recordReference,
};

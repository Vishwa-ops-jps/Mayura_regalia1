const model = require('../models/orderModel');
const productModel = require('../models/productModel');

async function listOrders(req, res) {
  try {
    const orders = await model.findAll({ status: req.query.status, search: req.query.search });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load orders' });
  }
}

async function getOrder(req, res) {
  try {
    const order = await model.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load order' });
  }
}

async function getOrderByNumber(req, res) {
  try {
    const order = await model.findByOrderNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load order' });
  }
}

function validate(body) {
  if (!body || typeof body !== 'object') return 'Request body is missing or not valid JSON';
  if (!body.customerName) return 'Customer name is required';
  if (!Array.isArray(body.items) || !body.items.length) return 'At least one order item is required';
  return null;
}

async function createOrder(req, res) {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    // req.customer is set by attachCustomerIfPresent when a logged-in
    // customer portal account placed this order; undefined for guest checkout.
    const payload = req.customer ? { ...req.body, customerId: req.customer.id } : req.body;
    const order = await model.create(payload);

    // Best-effort stock decrement; does not block order creation on failure.
    for (const item of req.body.items) {
      if (!item.productId && !item.id) continue;
      try {
        const product = await productModel.findById(item.productId || item.id);
        if (product) {
          const nextQty = Math.max(0, Number(product.stockQuantity || 0) - Number(item.quantity || 1));
          await productModel.adjustStock(product.id, nextQty, product.lowStockThreshold);
        }
      } catch { /* ignore stock sync errors */ }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to place order' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const order = await model.updateStatus(req.params.id, req.body);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update order' });
  }
}

async function deleteOrder(req, res) {
  try {
    const deleted = await model.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
}

module.exports = { listOrders, getOrder, getOrderByNumber, createOrder, updateOrderStatus, deleteOrder };

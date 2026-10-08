const Razorpay = require('razorpay');
const crypto = require('crypto');
const model = require('../models/paymentModel');
const orderModel = require('../models/orderModel');
const settingModel = require('../models/settingModel');

async function listPayments(req, res) {
  try {
    res.json(await model.findAll({ status: req.query.status }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load payments' });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const { status, transactionId } = req.body;
    if (!['pending', 'paid', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    const payment = await model.updateStatus(req.params.id, status, transactionId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update payment' });
  }
}

// Public, no-secret view of what payment options are currently live, so the
// storefront checkout can show/hide "Pay Online", COD and Direct UPI
// without ever seeing the Razorpay secret key.
async function getPaymentConfig(req, res) {
  try {
    const settings = await settingModel.getAll();
    res.json({
      codEnabled: settings.codEnabled !== 'false',
      razorpayEnabled: settings.razorpayEnabled === 'true' && Boolean(settings.razorpayKeyId) && Boolean(settings.razorpayKeySecret),
      directUpiEnabled: settings.directUpiEnabled === 'true' && Boolean(settings.upiId),
      upiId: settings.upiId || '',
      storeName: settings.storeName || 'Mayura Regalia',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load payment options' });
  }
}

// Direct UPI (no gateway): the customer scans/opens a UPI deep link built
// from the admin's own UPI ID, pays in their own UPI app, and reports back
// the UTR/reference number they were shown. There's nothing to verify this
// against server-side - it's just recorded on the (still-pending) payment
// so the admin has something to cross-check in their bank/UPI app before
// marking the order paid from the existing Payments screen.
async function submitDirectUpiReference(req, res) {
  try {
    const { orderId, utr, proofImage } = req.body;
    if (!orderId || !utr || !String(utr).trim()) {
      return res.status(400).json({ message: 'orderId and a UPI reference/UTR number are required' });
    }
    // Optional payment-screenshot upload, sent as a base64 data URL (same
    // pattern used for product/category/banner images elsewhere in this
    // app - no separate file storage needed). Keep it capped well under
    // MySQL's default max_allowed_packet so a huge photo can't fail the query.
    if (proofImage) {
      if (!/^data:image\/(png|jpe?g|webp);base64,/.test(proofImage)) {
        return res.status(400).json({ message: 'Screenshot must be a PNG, JPG or WEBP image' });
      }
      if (proofImage.length > 6_000_000) {
        return res.status(400).json({ message: 'Screenshot is too large. Please upload one under ~4MB.' });
      }
    }
    const payment = await model.recordReference(orderId, String(utr).trim(), proofImage || null);
    if (!payment) return res.status(404).json({ message: 'Order not found' });
    res.json({ ok: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save payment reference' });
  }
}

async function getRazorpayContext() {
  const settings = await settingModel.getAll();
  if (settings.razorpayEnabled !== 'true') {
    throw Object.assign(new Error('Online payments are currently unavailable. Please choose Cash on Delivery.'), { status: 400 });
  }
  if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
    throw Object.assign(new Error('Payment gateway is not configured yet. Please choose Cash on Delivery.'), { status: 400 });
  }
  return { settings, instance: new Razorpay({ key_id: settings.razorpayKeyId, key_secret: settings.razorpayKeySecret }) };
}

// Step 1 of online checkout: create a Razorpay order for the exact amount
// of an order we already created (as pending) in our own DB, and remember
// the gateway's order id so verify/webhook can find their way back to it.
async function createRazorpayOrder(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const { settings, instance } = await getRazorpayContext();
    const amountPaise = Math.round(Number(order.total) * 100);
    if (!amountPaise || amountPaise < 100) {
      return res.status(400).json({ message: 'Order amount is too small to charge online' });
    }

    const rzpOrder = await instance.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: { orderId: String(order.id), orderNumber: order.orderNumber },
    });

    await model.setGatewayOrderId(order.id, rzpOrder.id);

    res.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: settings.razorpayKeyId,
      orderNumber: order.orderNumber,
      storeName: settings.storeName || 'Mayura Regalia',
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).json({ message: error.message || 'Failed to start online payment' });
  }
}

// Step 2: the browser gets back razorpay_payment_id/order_id/signature from
// the checkout widget. We must verify that signature server-side with our
// secret key before trusting that the payment actually succeeded - never
// mark an order paid based on the client's word alone.
async function verifyRazorpayPayment(req, res) {
  try {
    const { orderId, razorpay_order_id: rzpOrderId, razorpay_payment_id: rzpPaymentId, razorpay_signature: rzpSignature } = req.body;
    if (!orderId || !rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    const { settings, instance } = await getRazorpayContext();
    const expectedSignature = crypto
      .createHmac('sha256', settings.razorpayKeySecret)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');

    if (expectedSignature !== rzpSignature) {
      await model.markFailed(orderId);
      return res.status(400).json({ verified: false, message: 'Payment verification failed' });
    }

    // Best-effort: ask Razorpay which instrument was actually used so the
    // admin Payments table shows "UPI" / "Card" / "Netbanking" instead of
    // just "Online". Verification has already succeeded at this point, so
    // this never blocks marking the order paid.
    let method = 'Online';
    try {
      const paymentDetails = await instance.payments.fetch(rzpPaymentId);
      if (paymentDetails?.method) method = paymentDetails.method.toUpperCase();
    } catch (err) {
      console.error('Could not fetch Razorpay payment method:', err.message);
    }

    const payment = await model.markPaid(orderId, { transactionId: rzpPaymentId, method });
    res.json({ verified: true, payment });
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).json({ verified: false, message: error.message || 'Payment verification failed' });
  }
}

// Called when the customer closes the Razorpay modal without paying, or the
// widget reports payment.failed - keeps the admin Payments view accurate
// instead of leaving the order stuck on "pending" forever.
async function markPaymentFailed(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });
    await model.markFailed(orderId);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update payment' });
  }
}

// Razorpay webhook (Settings > Webhooks in the Razorpay dashboard). This is
// a safety net for cases where the customer's browser closes/loses
// connection right after paying, before our verify call runs - the webhook
// still arrives server-to-server and reconciles the order.
async function razorpayWebhook(req, res) {
  try {
    const settings = await settingModel.getAll();
    const webhookSecret = settings.razorpayWebhookSecret;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret) {
      if (!signature) return res.status(400).json({ message: 'Missing webhook signature' });
      const expected = crypto.createHmac('sha256', webhookSecret).update(req.rawBody || JSON.stringify(req.body)).digest('hex');
      if (expected !== signature) return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;
    if (!paymentEntity) return res.json({ received: true });

    const payment = await model.findByGatewayOrderId(paymentEntity.order_id);
    if (!payment) return res.json({ received: true });

    if (event === 'payment.captured') {
      await model.markPaid(payment.orderId, { transactionId: paymentEntity.id, method: (paymentEntity.method || 'online').toUpperCase() });
    } else if (event === 'payment.failed') {
      await model.markFailed(payment.orderId);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}

module.exports = {
  listPayments, updatePaymentStatus, getPaymentConfig,
  createRazorpayOrder, verifyRazorpayPayment, markPaymentFailed, razorpayWebhook,
  submitDirectUpiReference,
};

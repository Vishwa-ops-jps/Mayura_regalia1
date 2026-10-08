const express = require('express');
const controller = require('../controllers/paymentController');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Admin-only: the payments list/management screen.
router.get('/', requireAdmin, controller.listPayments);
router.put('/:id/status', requireAdmin, controller.updatePaymentStatus);

// Public: used by the storefront checkout, so no admin token here. These
// only ever act on an order's own payment row and never expose secrets.
router.get('/config', controller.getPaymentConfig);
router.post('/razorpay/create-order', controller.createRazorpayOrder);
router.post('/razorpay/verify', controller.verifyRazorpayPayment);
router.post('/razorpay/failed', controller.markPaymentFailed);
router.post('/razorpay/webhook', controller.razorpayWebhook);
router.post('/direct-upi/reference', controller.submitDirectUpiReference);

module.exports = router;

const express = require('express');
const controller = require('../controllers/settingController');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
// Admin-only: this payload includes secrets (Razorpay key secret, webhook
// secret, the storefront API secret key), so it must never be public. The
// storefront itself doesn't call this endpoint - it uses
// GET /api/payments/config for the handful of payment flags it needs.
router.get('/', requireAdmin, controller.getSettings);
router.put('/', requireAdmin, controller.updateSettings);
module.exports = router;

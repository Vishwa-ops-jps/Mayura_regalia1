const express = require('express');
const { signup, login, me, myOrders, forgotPassword, resetPassword, cancelOrder, requestReturn } = require('../controllers/customerAuthController');
const { requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Public - customer self sign-up / login for the storefront portal.
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Requires a valid customer session token.
router.get('/me', requireCustomer, me);
router.get('/me/orders', requireCustomer, myOrders);
router.post('/me/orders/:id/cancel', requireCustomer, cancelOrder);
router.post('/me/orders/:id/return', requireCustomer, requestReturn);

module.exports = router;

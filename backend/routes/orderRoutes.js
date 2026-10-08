const express = require('express');
const controller = require('../controllers/orderController');
const { requireAdmin, attachCustomerIfPresent } = require('../middleware/auth');
const router = express.Router();
router.get('/', requireAdmin, controller.listOrders);
// Public tracking needs order number + email/phone (see trackOrder). The old public lookup by
// order number alone exposed names, phones and addresses, so it is now admin-only.
router.post('/track', controller.trackOrder);
router.get('/number/:orderNumber', requireAdmin, controller.getOrderByNumber);
router.get('/:id', requireAdmin, controller.getOrder);
router.post('/', attachCustomerIfPresent, controller.createOrder);
router.put('/:id/status', requireAdmin, controller.updateOrderStatus);
router.delete('/:id', requireAdmin, controller.deleteOrder);
module.exports = router;

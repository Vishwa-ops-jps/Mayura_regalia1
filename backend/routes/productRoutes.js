const express = require('express');
const controller = require('../controllers/productController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', controller.getProducts);
router.get('/:id', controller.getProduct);
router.post('/', requireAdmin, controller.createProduct);
router.put('/:id', requireAdmin, controller.updateProduct);
router.delete('/:id', requireAdmin, controller.deleteProduct);

module.exports = router;

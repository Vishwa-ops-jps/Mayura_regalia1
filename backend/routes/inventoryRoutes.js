const express = require('express');
const controller = require('../controllers/inventoryController');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.get('/', requireAdmin, controller.listInventory);
router.put('/:id', requireAdmin, controller.adjustStock);
module.exports = router;

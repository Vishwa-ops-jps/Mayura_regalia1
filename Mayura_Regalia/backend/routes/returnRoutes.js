const express = require('express');
const controller = require('../controllers/returnController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.get('/', requireAdmin, controller.list);
router.put('/:id', requireAdmin, controller.update);

module.exports = router;

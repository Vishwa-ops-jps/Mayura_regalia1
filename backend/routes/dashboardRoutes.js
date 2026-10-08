const express = require('express');
const controller = require('../controllers/dashboardController');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.get('/summary', requireAdmin, controller.getSummary);
router.get('/reports', requireAdmin, controller.getSalesReport);
module.exports = router;

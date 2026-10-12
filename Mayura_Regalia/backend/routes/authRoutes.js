const express = require('express');
const { login } = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.post('/login', login);
// Lets the admin UI check that its saved token is still valid.
router.get('/verify', requireAdmin, (req, res) => res.json({ valid: true, admin: req.admin }));

module.exports = router;

const express = require('express');
const controller = require('../controllers/addressController');
const { requireCustomer } = require('../middleware/auth');
const router = express.Router();

router.use(requireCustomer);
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/default', controller.setDefault);

module.exports = router;

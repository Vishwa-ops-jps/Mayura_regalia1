const express = require('express');
const { getWishlist, getWishlistIds, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { requireCustomer } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes need a logged-in customer; each user only ever sees
// and edits their own list.
router.use(requireCustomer);

router.get('/', getWishlist);
router.get('/ids', getWishlistIds);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;

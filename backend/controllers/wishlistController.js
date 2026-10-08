const wishlistModel = require('../models/wishlistModel');

// Every handler is behind requireCustomer, so req.customer.id is always the
// logged-in user - one customer can never read or change another's wishlist.

async function getWishlist(req, res) {
  try {
    res.json(await wishlistModel.listForCustomer(req.customer.id));
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Unable to load your wishlist right now' });
  }
}

async function getWishlistIds(req, res) {
  try {
    res.json(await wishlistModel.idsForCustomer(req.customer.id));
  } catch (error) {
    console.error('Get wishlist ids error:', error);
    res.status(500).json({ message: 'Unable to load your wishlist right now' });
  }
}

async function addToWishlist(req, res) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Invalid product' });
    }
    if (!(await wishlistModel.productExists(productId))) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await wishlistModel.add(req.customer.id, productId);
    res.status(201).json({ message: 'Added to wishlist', productId });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Unable to update your wishlist right now' });
  }
}

async function removeFromWishlist(req, res) {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Invalid product' });
    }
    await wishlistModel.remove(req.customer.id, productId);
    res.json({ message: 'Removed from wishlist', productId });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Unable to update your wishlist right now' });
  }
}

module.exports = { getWishlist, getWishlistIds, addToWishlist, removeFromWishlist };

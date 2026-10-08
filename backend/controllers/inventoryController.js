const productModel = require('../models/productModel');

async function listInventory(req, res) {
  try {
    const products = await productModel.findAll({ category: req.query.category, search: req.query.search });
    const inventory = products.map((p) => ({
      id: p.id, name: p.name, category: p.category, image: p.image, sku: p.sku,
      stockQuantity: p.stockQuantity, lowStockThreshold: p.lowStockThreshold, inStock: p.inStock,
      isLowStock: p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold,
    }));
    res.json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load inventory' });
  }
}

async function adjustStock(req, res) {
  try {
    const { stockQuantity, lowStockThreshold } = req.body;
    if (stockQuantity == null || Number.isNaN(Number(stockQuantity))) {
      return res.status(400).json({ message: 'A valid stock quantity is required' });
    }
    const product = await productModel.adjustStock(req.params.id, stockQuantity, lowStockThreshold);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update stock' });
  }
}

module.exports = { listInventory, adjustStock };

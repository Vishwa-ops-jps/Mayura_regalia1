const productModel = require('../models/productModel');

async function getProducts(req, res) {
  try {
    const products = await productModel.findAll({ category: req.query.category, search: req.query.search });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load products' });
  }
}

async function getProduct(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load product' });
  }
}

function validate(body) {
  if (!body || typeof body !== 'object') return 'Request body is missing or not valid JSON';
  if (!body.name || !body.category) return 'Name and category are required';
  if (Number.isNaN(Number(body.price)) || Number(body.price) < 0) return 'A valid price is required';
  return null;
}

async function createProduct(req, res) {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const product = await productModel.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });
    const product = await productModel.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const deleted = await productModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
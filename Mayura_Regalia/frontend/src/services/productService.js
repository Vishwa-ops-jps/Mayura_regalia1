import {
  products as fallbackProducts,
  getProductById as getMockProductById,
  getProductsByCategory as getMockProductsByCategory,
  searchProducts as searchMockProducts,
} from '../data/products';
import { apiRequest } from './api';

const productService = {
  async getProducts(category = 'all') {
    try {
      const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
      return await apiRequest(`/products${query}`);
    } catch {
      return category === 'all' ? fallbackProducts : getMockProductsByCategory(category);
    }
  },

  async getProductById(id) {
    try {
      return await apiRequest(`/products/${id}`);
    } catch {
      const product = getMockProductById(id);
      if (!product) throw new Error('Product not found');
      return product;
    }
  },

  async getProductsByCategory(category) {
    return this.getProducts(category);
  },

  async searchProducts(query) {
    try {
      return await apiRequest(`/products?search=${encodeURIComponent(query)}`);
    } catch {
      return searchMockProducts(query);
    }
  },

  async getAllProducts() {
    return this.getProducts('all');
  },
};

export default productService;

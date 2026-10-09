import {
  products as fallbackProducts,
  getProductById as getMockProductById,
  getProductsByCategory as getMockProductsByCategory,
  searchProducts as searchMockProducts,
} from '../data/products';
import { apiRequest } from './api';

const productService = {
  async getProducts(filter = 'all', options = {}) {
    let category = 'all';
    let material = '';
    let search = '';

    if (typeof filter === 'string') {
      category = filter;
      material = options.material || '';
      search = options.search || '';
    } else if (filter && typeof filter === 'object') {
      category = filter.category || 'all';
      material = filter.material || '';
      search = filter.search || '';
    }

    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (material) {
        params.append('material', material);
      }
      if (search) {
        params.append('search', search);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      return await apiRequest(`/products${qs}`);
    } catch {
      let result = category === 'all' ? fallbackProducts : getMockProductsByCategory(category);
      if (material && Array.isArray(result)) {
        result = result.filter(
          (p) =>
            p.material && p.material.toLowerCase().trim() === material.toLowerCase().trim()
        );
      }
      return result;
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

  async getProductsByCategory(category, material) {
    return this.getProducts({ category, material });
  },

  async getCategories() {
    try {
      return await apiRequest('/products/categories');
    } catch {
      return {
        groups: [
          {
            id: 'jewels',
            name: 'JEWELS',
            slug: 'jewels',
            subcategories: [
              { name: '22 CARAT', slug: '22-carat', query: { category: 'Jewels', material: '22 Carat' } },
              { name: '18 CARAT', slug: '18-carat', query: { category: 'Jewels', material: '18 Carat' } },
            ],
          },
          {
            id: 'fashion-jewels',
            name: 'FASHION JEWELS',
            slug: 'fashion-jewels',
            subcategories: [
              { name: 'Bangles', slug: 'bangles', query: { category: 'Bangles' } },
              { name: 'Bridal Jewellery', slug: 'bridal jewellery', query: { category: 'Bridal Jewellery' } },
              { name: 'Necklaces', slug: 'necklaces', query: { category: 'Necklaces' } },
              { name: 'Earrings', slug: 'earrings', query: { category: 'Earrings' } },
              { name: 'Rings', slug: 'rings', query: { category: 'Rings' } },
              { name: 'Bracelets', slug: 'bracelets', query: { category: 'Bracelets' } },
            ],
          },
          {
            id: 'silver-jewellery',
            name: 'SILVER JEWELLERY',
            slug: 'silver-jewellery',
            subcategories: [
              { name: 'Silver', slug: 'silver', query: { category: 'Silver' } },
              { name: 'German Silver', slug: 'german-silver', query: { category: 'German Silver' } },
            ],
          },
          { id: 'sarees', name: 'SAREES', slug: 'sarees', subcategories: [] },
          { id: 'bags', name: 'BAGS', slug: 'bags', materials: [], subcategories: [] },
          { id: 'watches', name: 'WATCHES', slug: 'watches', subcategories: [] },
          { id: 'gifts', name: 'GIFTS', slug: 'gifts', subcategories: [] },
        ],
        categoryCounts: {},
      };
    }
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

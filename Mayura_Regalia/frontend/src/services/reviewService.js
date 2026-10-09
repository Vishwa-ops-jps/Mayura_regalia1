import { apiRequest } from './api';

const reviewService = {
  async getProductReviews(productId) {
    try {
      const all = await apiRequest(`/reviews?status=approved`);
      return all.filter((r) => String(r.productId) === String(productId));
    } catch {
      return [];
    }
  },

  async submitReview({ productId, productName, customerName, email, rating, comment }) {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId, productName, customerName, email, rating, comment }),
    });
  },
};

export default reviewService;

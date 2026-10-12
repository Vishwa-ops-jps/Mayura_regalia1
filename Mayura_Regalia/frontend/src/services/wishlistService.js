import { API_URL } from './api';
import customerAuthService from './customerAuthService';

// Wishlist is stored per customer on the server, so it follows the user
// across devices and is never shared between accounts.
async function request(path, options = {}) {
  const token = customerAuthService.getToken();
  const response = await fetch(`${API_URL}/wishlist${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Wishlist request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

const wishlistService = {
  getWishlist: () => request(''),
  getIds: () => request('/ids'),
  add: (productId) => request(`/${productId}`, { method: 'POST' }),
  remove: (productId) => request(`/${productId}`, { method: 'DELETE' }),
};

export default wishlistService;

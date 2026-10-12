import { apiRequest as baseRequest } from '../../services/api';
import authService from '../../services/authService';

function authHeaders() {
  return { Authorization: `Bearer ${authService.getToken()}` };
}

const EXPIRED_MESSAGES = ['Invalid or expired admin token', 'Admin authentication required'];

// Same as the shared apiRequest, but an expired/invalid admin token clears the
// session and returns to the login page instead of leaving a dead error on screen.
async function apiRequest(path, options = {}) {
  if (!authService.getToken()) {
    authService.handleExpired();
    throw new Error('Admin session expired. Please log in again.');
  }
  try {
    return await baseRequest(path, options);
  } catch (error) {
    if (EXPIRED_MESSAGES.includes(error.message)) {
      authService.handleExpired();
      throw new Error('Admin session expired. Please log in again.');
    }
    throw error;
  }
}

// Generic REST resource client used by every simple admin module
// (categories, collections, banners, gifts, coupons, reviews, customers...).
function createResource(basePath) {
  return {
    list: (query = '') => apiRequest(`${basePath}${query}`, { headers: authHeaders() }),
    get: (id) => apiRequest(`${basePath}/${id}`, { headers: authHeaders() }),
    create: (data) => apiRequest(basePath, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`${basePath}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
    remove: (id) => apiRequest(`${basePath}/${id}`, { method: 'DELETE', headers: authHeaders() }),
  };
}

export const categoriesApi = createResource('/categories');
export const collectionsApi = createResource('/collections');
export const bannersApi = createResource('/banners');
export const giftsApi = createResource('/gifts');
export const couponsApi = createResource('/coupons');
export const customersApi = createResource('/customers');

export const reviewsApi = {
  ...createResource('/reviews'),
  updateStatus: (id, status) => apiRequest(`/reviews/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status }) }),
};

export const ordersApi = {
  list: (query = '') => apiRequest(`/orders${query}`, { headers: authHeaders() }),
  get: (id) => apiRequest(`/orders/${id}`, { headers: authHeaders() }),
  updateStatus: (id, data) => apiRequest(`/orders/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/orders/${id}`, { method: 'DELETE', headers: authHeaders() }),
};

export const returnsApi = {
  list: (query = '') => apiRequest(`/returns${query}`, { headers: authHeaders() }),
  update: (id, data) => apiRequest(`/returns/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
};

export const paymentsApi = {
  list: (query = '') => apiRequest(`/payments${query}`, { headers: authHeaders() }),
  updateStatus: (id, data) => apiRequest(`/payments/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
};

export const inventoryApi = {
  list: (query = '') => apiRequest(`/inventory${query}`, { headers: authHeaders() }),
  adjust: (id, data) => apiRequest(`/inventory/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
};

export const productsApi = {
  list: (query = '') => apiRequest(`/products${query}`, { headers: authHeaders() }),
  create: (data) => apiRequest('/products', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/products/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/products/${id}`, { method: 'DELETE', headers: authHeaders() }),
};

export const dashboardApi = {
  summary: () => apiRequest('/dashboard/summary', { headers: authHeaders() }),
  reports: (days = 30) => apiRequest(`/dashboard/reports?days=${days}`, { headers: authHeaders() }),
};

export const settingsApi = {
  get: () => apiRequest('/settings', { headers: authHeaders() }),
  update: (data) => apiRequest('/settings', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  resetHero: () => apiRequest('/settings/hero/reset', { method: 'POST', headers: authHeaders() }),
};

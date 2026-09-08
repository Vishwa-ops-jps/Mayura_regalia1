import { API_URL } from './api';

const TOKEN_KEY = 'mayura_admin_token';
const ADMIN_KEY = 'mayura_admin';

const authService = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getAdmin() {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null');
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};

export default authService;

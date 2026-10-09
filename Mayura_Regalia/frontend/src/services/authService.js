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

  // Asks the server whether the saved admin token is still accepted.
  async verify() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) return false;
      return true; // network/server errors should not log the admin out
    } catch {
      return true;
    }
  },

  // Clears a dead token and sends the admin back to the login page.
  handleExpired() {
    this.logout();
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.replace('/admin/login?expired=1');
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};

export default authService;

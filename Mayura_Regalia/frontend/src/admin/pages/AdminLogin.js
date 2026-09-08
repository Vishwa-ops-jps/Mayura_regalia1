import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@mayuraregalia.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Admin Login | Mayura Regalia';
  }, []);

  if (authService.isAuthenticated()) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-brand-panel">
        <div className="brand-glow" />
        <img src="/logo.png" alt="Mayura Regalia" />
        <p>Jewellery Administration</p>
        <h1>Manage your store with elegance.</h1>
        <span>Products • Inventory • Orders • Customers</span>
      </div>

      <div className="admin-login-card">
        <div className="admin-login-heading">
          <span className="eyebrow">MAYURA REGALIA</span>
          <h2>Welcome back</h2>
          <p>Sign in to access your admin dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mayuraregalia.com"
            required
          />

          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to Admin Panel'}
          </button>
        </form>

        <button className="back-store-btn" onClick={() => navigate('/')}>
          ← Back to storefront
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;

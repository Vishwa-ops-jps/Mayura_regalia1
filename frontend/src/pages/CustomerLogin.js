import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import customerAuthService from '../services/customerAuthService';
import '../styles/CustomerAuth.css';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Login | Mayura Regalia';
  }, []);

  if (customerAuthService.isAuthenticated()) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await customerAuthService.login(phone.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-page">
      <div className="customer-auth-card">
        <span className="customer-auth-eyebrow">MAYURA REGALIA</span>
        <h1>Welcome back</h1>
        <p>Login with your phone number to view your orders.</p>

        <form onSubmit={handleSubmit}>
          <label>Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />

          <label>Password</label>
          <div className="customer-auth-password-field">
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

          <div className="customer-auth-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {error && <div className="customer-auth-error">{error}</div>}

          <button className="customer-auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="customer-auth-switch">
          New here? <Link to="/signup" state={location.state}>Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;

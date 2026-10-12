import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import customerAuthService from '../services/customerAuthService';
import '../styles/CustomerAuth.css';

const CustomerSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/account';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create Account | Mayura Regalia';
  }, []);

  if (customerAuthService.isAuthenticated()) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setError('Please add your complete shipping address');
      return;
    }

    setLoading(true);
    try {
      await customerAuthService.signup(name.trim(), phone.trim(), password, {
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
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
        <h1>Create your account</h1>
        <p>Sign up to track your orders anytime.</p>

        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />

          <label>Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />

          <label>Set password</label>
          <div className="customer-auth-password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <label>Shipping address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House no., street, locality"
            required
          />

          <div className="customer-auth-field-row">
            <div>
              <label>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                required
              />
            </div>
            <div>
              <label>State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                required
              />
            </div>
          </div>

          <label>Pincode</label>
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="6-digit pincode"
            inputMode="numeric"
            maxLength={6}
            required
          />

          {error && <div className="customer-auth-error">{error}</div>}

          <button className="customer-auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="customer-auth-switch">
          Already have an account? <Link to="/login" state={location.state}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;

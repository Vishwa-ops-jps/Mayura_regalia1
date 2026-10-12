import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import customerAuthService from '../services/customerAuthService';
import '../styles/CustomerAuth.css';

const RESEND_SECONDS = 60;

const CustomerForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter OTP + new password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.title = 'Forgot Password | Mayura Regalia';
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await customerAuthService.forgotPassword(phone.trim());
      setSuccess(data.message);
      setStep(2);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSubmit = (e) => {
    e.preventDefault();
    sendCode();
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = await customerAuthService.resetPassword(phone.trim(), otp.trim(), newPassword);
      setSuccess(data.message);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
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
        <h1>Forgot password</h1>
        <p>
          {step === 1
            ? 'Enter your registered phone number and we will send you a verification code.'
            : 'Enter the code we sent you and choose a new password.'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendSubmit}>
            <label>Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              required
            />

            {error && <div className="customer-auth-error">{error}</div>}

            <button className="customer-auth-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit}>
            <label>Phone number</label>
            <input type="tel" value={phone} disabled />

            <label>Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="6-digit code"
              required
            />

            <label>New password</label>
            <div className="customer-auth-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <label>Confirm new password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />

            {error && <div className="customer-auth-error">{error}</div>}
            {success && <div className="customer-auth-success">{success}</div>}

            <button className="customer-auth-submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>

            <div className="customer-auth-switch">
              Didn't get the code?{' '}
              <button
                type="button"
                className="customer-auth-link-button"
                onClick={sendCode}
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        <div className="customer-auth-switch">
          Remembered it? <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerForgotPassword;

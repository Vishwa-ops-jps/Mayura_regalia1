import React, { useEffect, useState } from 'react';
import { settingsApi } from '../services/adminApi';
import HeroSlidesEditor from './HeroSlidesEditor';

// Generates a random, prefixed key using the browser's crypto API â€” good
// enough entropy for a demo/dev-style storefront API key.
const generateKey = (prefix) => {
  const bytes = new Uint8Array(24);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${token}`;
};

const Settings = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [revealRazorpaySecret, setRevealRazorpaySecret] = useState(false);
  const [revealWebhookSecret, setRevealWebhookSecret] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setForm(await settingsApi.get());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setForm((current) => ({ ...current, [name]: checked ? 'true' : 'false' }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await settingsApi.update({
        ...form,
        goldPriceUpdatedAt: new Date().toISOString(),
      });
      setForm(updated);
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveKeys = async (patch) => {
    setKeySaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await settingsApi.update(patch);
      setForm(updated);
      setMessage('API keys updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setKeySaving(false);
    }
  };

  const regenerateKey = (type) => {
    const label = type === 'apiKeyPublic' ? 'publishable' : 'secret';
    if (form[type] && !window.confirm(`Generate a new ${label} key? The current one will stop working immediately.`)) return;
    const prefix = type === 'apiKeyPublic' ? 'pk_live' : 'sk_live';
    saveKeys({ [type]: generateKey(prefix), apiKeyCreatedAt: new Date().toISOString() });
  };

  const copyValue = (value, field) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  if (loading) return <div className="admin-loading">Loading settings...</div>;
  if (!form) return <div className="admin-error">{error || 'Could not load settings'}</div>;

  return (
    <section>
      {message && <div className="admin-success">âœ“ {message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <HeroSlidesEditor value={form.heroSlides} onSaved={(updated) => setForm((cur) => ({ ...cur, ...updated }))} />

      {/* â”€â”€ API Keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="admin-panel-card api-keys-card">
        <div className="panel-heading"><div><span>DEVELOPER</span><h2>API Keys</h2></div></div>
        <p className="api-key-hint">
          Use these keys to authenticate requests from your storefront, mobile app or third-party integrations.
          The secret key should never be exposed in client-side code.
        </p>

        <div className="api-key-block">
          <div className="api-key-block-head">
            <span>Publishable key <em>(safe for client-side use)</em></span>
            <button type="button" className="save-btn ghost" disabled={keySaving} onClick={() => regenerateKey('apiKeyPublic')}>
              {form.apiKeyPublic ? 'Regenerate' : 'Generate key'}
            </button>
          </div>
          {form.apiKeyPublic ? (
            <div className="api-key-row">
              <span className="api-key-badge">LIVE</span>
              <code>{form.apiKeyPublic}</code>
              <button type="button" className="api-key-copy" onClick={() => copyValue(form.apiKeyPublic, 'pub')}>
                {copiedField === 'pub' ? 'âœ“ Copied' : 'Copy'}
              </button>
            </div>
          ) : <p className="api-key-empty">No publishable key yet.</p>}
        </div>

        <div className="api-key-block">
          <div className="api-key-block-head">
            <span>Secret key <em>(server-side only, keep private)</em></span>
            <button type="button" className="save-btn ghost" disabled={keySaving} onClick={() => regenerateKey('apiKeySecret')}>
              {form.apiKeySecret ? 'Regenerate' : 'Generate key'}
            </button>
          </div>
          {form.apiKeySecret ? (
            <div className="api-key-row">
              <span className="api-key-badge secret">SECRET</span>
              <code>{revealSecret ? form.apiKeySecret : `${form.apiKeySecret.slice(0, 7)}${'â€¢'.repeat(24)}`}</code>
              <button type="button" className="api-key-copy" onClick={() => setRevealSecret((v) => !v)}>{revealSecret ? 'Hide' : 'Reveal'}</button>
              <button type="button" className="api-key-copy" onClick={() => copyValue(form.apiKeySecret, 'secret')}>
                {copiedField === 'secret' ? 'âœ“ Copied' : 'Copy'}
              </button>
            </div>
          ) : <p className="api-key-empty">No secret key yet.</p>}
        </div>
        {form.apiKeyCreatedAt && (
          <p className="api-key-hint">Last generated {new Date(form.apiKeyCreatedAt).toLocaleString('en-IN')}.</p>
        )}
      </div>

      <div className="admin-panel-card">
        <form className="settings-form" onSubmit={save}>
          <div className="settings-section-title">Store details</div>
          <label>Store name<input name="storeName" value={form.storeName || ''} onChange={handleChange} /></label>
          <label>Support email<input name="storeEmail" type="email" value={form.storeEmail || ''} onChange={handleChange} /></label>
          <label>Support phone<input name="storePhone" value={form.storePhone || ''} onChange={handleChange} /></label>
          <label>Currency<input name="currency" value={form.currency || ''} onChange={handleChange} /></label>
          <label className="full-width">Store address<input name="address" value={form.address || ''} onChange={handleChange} /></label>

          <div className="settings-section-title">Shipping &amp; tax</div>
          <label>Shipping fee (â‚¹)<input name="shippingFee" type="number" min="0" value={form.shippingFee || 0} onChange={handleChange} /></label>
          <label>Free shipping above (â‚¹)<input name="freeShippingThreshold" type="number" min="0" value={form.freeShippingThreshold || 0} onChange={handleChange} /></label>
          <label>Tax rate (%)<input name="taxRate" type="number" min="0" value={form.taxRate || 0} onChange={handleChange} /></label>

          <div className="settings-section-title">Gold pricing</div>
          <p className="api-key-hint full-width" style={{ gridColumn: '1/-1', marginTop: '-.4rem' }}>
            Enter the current market price per gram in your store currency. These values are available to the
            storefront and help you keep pricing and making charges up to date.
          </p>
          <label>24K gold / gram<input name="goldPrice24k" type="number" min="0" step="0.01" value={form.goldPrice24k || 0} onChange={handleChange} /></label>
          <label>22K gold / gram<input name="goldPrice22k" type="number" min="0" step="0.01" value={form.goldPrice22k || 0} onChange={handleChange} /></label>
          <label>18K gold / gram<input name="goldPrice18k" type="number" min="0" step="0.01" value={form.goldPrice18k || 0} onChange={handleChange} /></label>
          <label>Making charge (%)<input name="makingChargePercent" type="number" min="0" step="0.01" value={form.makingChargePercent || 0} onChange={handleChange} /></label>
          <label>Wastage (%)<input name="wastagePercent" type="number" min="0" step="0.01" value={form.wastagePercent || 0} onChange={handleChange} /></label>
          <p className="api-key-hint full-width" style={{ gridColumn: '1/-1' }}>
            Last updated: {form.goldPriceUpdatedAt ? new Date(form.goldPriceUpdatedAt).toLocaleString('en-IN') : 'Not updated yet'}
          </p>

          <div className="settings-section-title">Payment gateway &mdash; Razorpay</div>
          <p className="api-key-hint full-width" style={{ gridColumn: '1/-1', marginTop: '-.4rem' }}>
            Once enabled, customers can pay by debit/credit card, UPI, netbanking or wallet from a single
            checkout screen. Every payment settles into whichever bank account is linked to <strong>your own</strong>{' '}
            Razorpay account (set that up on Razorpay's dashboard, not here) &mdash; the keys below just tell our
            checkout which Razorpay account to charge to. Get your Key ID and Key Secret from your Razorpay
            dashboard under Settings &rarr; API Keys.
          </p>

          <label className="full-width toggle-row">
            <input type="checkbox" name="razorpayEnabled" checked={form.razorpayEnabled === 'true' || form.razorpayEnabled === true} onChange={handleToggle} />
            <span>Enable online payments (cards, UPI, netbanking, wallets)</span>
          </label>
          <label className="full-width toggle-row">
            <input type="checkbox" name="codEnabled" checked={form.codEnabled !== 'false' && form.codEnabled !== false} onChange={handleToggle} />
            <span>Enable Cash on Delivery</span>
          </label>

          <label>Razorpay Key ID<input name="razorpayKeyId" placeholder="rzp_live_xxxxxxxxxxxx" value={form.razorpayKeyId || ''} onChange={handleChange} /></label>
          <label>
            Razorpay Key Secret
            <div className="secret-input-row">
              <input
                name="razorpayKeySecret"
                type={revealRazorpaySecret ? 'text' : 'password'}
                placeholder="Paste your secret key"
                value={form.razorpayKeySecret || ''}
                onChange={handleChange}
                autoComplete="off"
              />
              <button type="button" className="save-btn ghost" onClick={() => setRevealRazorpaySecret((v) => !v)}>
                {revealRazorpaySecret ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </label>
          <label>
            Webhook secret <em>(optional, recommended)</em>
            <div className="secret-input-row">
              <input
                name="razorpayWebhookSecret"
                type={revealWebhookSecret ? 'text' : 'password'}
                placeholder="From Razorpay > Webhooks"
                value={form.razorpayWebhookSecret || ''}
                onChange={handleChange}
                autoComplete="off"
              />
              <button type="button" className="save-btn ghost" onClick={() => setRevealWebhookSecret((v) => !v)}>
                {revealWebhookSecret ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </label>

          <div className="settings-section-title">Payment gateway &mdash; Direct UPI</div>
          <p className="api-key-hint full-width" style={{ gridColumn: '1/-1', marginTop: '-.4rem' }}>
            A second, gateway-free way to accept UPI: customers scan a QR code or tap a UPI link and pay{' '}
            <strong>your UPI ID below directly</strong> &mdash; no Razorpay account needed, money lands straight in
            your bank. The trade-off: there's no automated confirmation, so each order will need you to check your
            UPI app/bank statement and mark it paid yourself from the Payments screen.
          </p>
          <label className="full-width toggle-row">
            <input type="checkbox" name="directUpiEnabled" checked={form.directUpiEnabled === 'true' || form.directUpiEnabled === true} onChange={handleToggle} />
            <span>Accept direct UPI payments (manual confirmation)</span>
          </label>
          <label className="full-width">
            Your UPI ID <em>(used for the QR/link above, and shown to customers as a reference under Razorpay too)</em>
            <input name="upiId" placeholder="yourstore@okhdfcbank" value={form.upiId || ''} onChange={handleChange} />
          </label>

          <div className="settings-section-title">Social links</div>
          <label>Instagram<input name="socialInstagram" value={form.socialInstagram || ''} onChange={handleChange} /></label>
          <label>Facebook<input name="socialFacebook" value={form.socialFacebook || ''} onChange={handleChange} /></label>

          <div className="modal-actions full-width" style={{ gridColumn: '1/-1' }}>
            <button className="save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Settings;

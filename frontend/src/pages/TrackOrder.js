import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import '../styles/InfoPages.css';
import '../styles/TrackOrder.css';

const STEPS = [
  { key: 'pending', label: 'Order placed', hint: 'We have received your order' },
  { key: 'processing', label: 'Being prepared', hint: 'Packing your jewellery with care' },
  { key: 'shipped', label: 'Shipped', hint: 'On its way to you' },
  { key: 'delivered', label: 'Delivered', hint: 'Enjoy your jewellery!' },
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

const TrackOrder = () => {
  usePageTitle('Track Your Order', 'Track your Mayura Regalia order with your order number and the email or phone used at checkout.');
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get('order') || '');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setOrderNumber(params.get('order') || ''); }, [params]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!orderNumber.trim() || !contact.trim()) {
      setError('Please enter your order number and the email or phone number used at checkout.');
      return;
    }
    setLoading(true);
    try {
      setResult(await apiRequest('/orders/track', {
        method: 'POST',
        body: JSON.stringify({ orderNumber: orderNumber.trim(), contact: contact.trim() }),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reached = (status) => {
    const entries = (result.history || []).filter((h) => h.status === status);
    return entries.length ? entries[entries.length - 1].at : null;
  };
  const currentIndex = result ? STEPS.findIndex((s) => s.key === result.orderStatus) : -1;
  const cancelled = result && result.orderStatus === 'cancelled';

  return (
    <div className="info-page">
      <div className="info-container">
        <nav className="info-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>Track Order</span></nav>
        <h1>Track Your Order</h1>
        <p className="info-lead">Enter your order number (it starts with MR-) and the email or phone number you used at checkout.</p>

        <form className="track-form" onSubmit={submit}>
          <label>
            Order number
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="MR-2026-12345" autoComplete="off" />
          </label>
          <label>
            Email or phone used at checkout
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or 98XXXXXXXX" autoComplete="off" />
          </label>
          <button type="submit" className="track-btn" disabled={loading}>{loading ? 'Checking...' : 'TRACK ORDER'}</button>
        </form>

        {error && <div className="track-error" role="alert">{error}</div>}

        {result && (
          <div className="track-result">
            <div className="track-head">
              <div><small>Order</small><strong>{result.orderNumber}</strong></div>
              <div><small>Placed on</small><strong>{fmt(result.createdAt)}</strong></div>
              <div><small>Payment</small><strong>{/cod/i.test(result.paymentMethod) ? 'Cash on Delivery' : result.paymentMethod} · {result.paymentStatus}</strong></div>
            </div>

            {cancelled ? (
              <div className="track-cancelled">This order was cancelled{reached('cancelled') ? ` on ${fmt(reached('cancelled'))}` : ''}. If you paid online, the refund returns to your original payment method, usually within 5-7 business days. Need help? <Link to="/contact">Contact us</Link>.</div>
            ) : (
              <ol className="track-steps">
                {STEPS.map((step, i) => {
                  const done = i <= currentIndex;
                  const when = reached(step.key) || (i === 0 ? result.createdAt : null);
                  return (
                    <li key={step.key} className={`${done ? 'done' : ''} ${i === currentIndex ? 'current' : ''}`}>
                      <span className="track-dot">{done ? '✓' : i + 1}</span>
                      <div><strong>{step.label}</strong><small>{done && when ? fmt(when) : step.hint}</small></div>
                    </li>
                  );
                })}
              </ol>
            )}

            {(result.courierName || result.trackingNumber) && !cancelled && (
              <div className="track-courier">
                <strong>Courier details</strong>
                {result.courierName && <span>Courier: {result.courierName}</span>}
                {result.trackingNumber && <span>Tracking number: {result.trackingNumber}</span>}
                {result.trackingUrl && <a href={result.trackingUrl} target="_blank" rel="noopener noreferrer">Track on the courier website</a>}
              </div>
            )}

            <div className="track-items">
              {(result.items || []).map((item, i) => (
                <div className="track-item" key={i}>
                  {item.image && <img src={item.image} alt={item.productName} />}
                  <div><p>{item.productName}</p><small>Qty {item.quantity} · {money(item.price)}</small></div>
                </div>
              ))}
              <div className="track-total"><span>Total</span><strong>{money(result.total)}</strong></div>
              {(result.city || result.state) && <small className="track-dest">Delivering to {[result.city, result.state].filter(Boolean).join(', ')}</small>}
            </div>

            <p className="track-help">Questions about this order? <Link to="/contact">Contact us</Link> with your order number.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;

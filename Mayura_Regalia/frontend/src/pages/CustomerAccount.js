import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import customerAuthService from '../services/customerAuthService';
import '../styles/CustomerAccount.css';

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Returns how many days ago a date was (0 = today).
const daysSince = (dateStr) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));

// ------- Cancel T&C modal -------
const CancelModal = ({ order, onConfirm, onClose, loading }) => (
  <div className="account-modal-overlay" onClick={onClose}>
    <div className="account-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Cancel Order {order.orderNumber}?</h3>
      <div className="account-modal-tnc">
        <p><strong>Cancellation Terms &amp; Conditions</strong></p>
        <ul>
          <li>Cancellation is allowed only for orders in <em>Pending</em> or <em>Processing</em> status.</li>
          <li>Once shipped, orders cannot be cancelled.</li>
          <li>For prepaid orders, refunds are processed within 5–7 business days to the original payment method.</li>
          <li>COD orders have no refund due on cancellation.</li>
        </ul>
      </div>
      <div className="account-modal-actions">
        <button className="account-modal-cancel-btn" onClick={onClose} disabled={loading}>Keep Order</button>
        <button className="account-modal-confirm-btn" onClick={onConfirm} disabled={loading}>
          {loading ? 'Cancelling…' : 'Yes, Cancel Order'}
        </button>
      </div>
    </div>
  </div>
);

// ------- Return / Replace modal -------
const ReturnModal = ({ order, type, onClose, onSubmit, loading }) => {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const handleSubmit = () => {
    if (!reason.trim()) { setErr('Please describe the reason for your request.'); return; }
    onSubmit(reason.trim());
  };
  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{type === 'return' ? 'Return' : 'Replace'} — Order {order.orderNumber}</h3>
        <div className="account-modal-tnc">
          <p><strong>Return &amp; Replacement Terms &amp; Conditions</strong></p>
          <ul>
            <li>Requests must be raised within <strong>10 days</strong> of delivery.</li>
            <li>Items must be unused, unwashed and in original packaging with all tags intact.</li>
            <li>Jewellery showing signs of wear, alteration, or damage is not eligible.</li>
            <li>Custom / personalised orders are non-returnable unless defective.</li>
            <li>Once approved, replacements are dispatched within 5–7 business days; refunds for returns within 7–10 business days.</li>
            <li>Our team may request photos of the item before approving the request.</li>
          </ul>
        </div>
        <label className="account-modal-label">Reason for {type === 'return' ? 'return' : 'replacement'} *</label>
        <textarea
          className="account-modal-textarea"
          rows={3}
          placeholder="Describe the issue with your order…"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setErr(''); }}
        />
        {err && <p className="account-modal-err">{err}</p>}
        <div className="account-modal-actions">
          <button className="account-modal-cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="account-modal-confirm-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : `Submit ${type === 'return' ? 'Return' : 'Replacement'} Request`}
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerAccount = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('6months');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [cancelTarget, setCancelTarget] = useState(null);   // order object
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState({});           // { [orderId]: message }

  const [returnTarget, setReturnTarget] = useState(null);   // { order, type }
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMsg, setReturnMsg] = useState({});           // { [orderId]: message }

  const customer = customerAuthService.getCustomer();

  useEffect(() => {
    document.title = 'My Account | Mayura Regalia';
  }, []);

  useEffect(() => {
    if (!customerAuthService.isAuthenticated()) return;
    setLoading(true);
    setError('');
    customerAuthService
      .getMyOrders(range)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (!customerAuthService.isAuthenticated()) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    customerAuthService.logout();
    navigate('/');
  };

  // --- Cancel ---
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const updated = await customerAuthService.cancelOrder(cancelTarget.id);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setCancelMsg((prev) => ({ ...prev, [cancelTarget.id]: 'Your order has been cancelled.' }));
    } catch (e) {
      setCancelMsg((prev) => ({ ...prev, [cancelTarget.id]: e.message }));
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  // --- Return / Replace ---
  const handleReturnSubmit = async (reason) => {
    if (!returnTarget) return;
    setReturnLoading(true);
    const { order, type } = returnTarget;
    try {
      await customerAuthService.requestReturn(order.id, type, reason);
      setReturnMsg((prev) => ({
        ...prev,
        [order.id]: `Your ${type} request has been submitted and is under review. We'll contact you shortly.`,
      }));
    } catch (e) {
      setReturnMsg((prev) => ({ ...prev, [order.id]: e.message }));
    } finally {
      setReturnLoading(false);
      setReturnTarget(null);
    }
  };

  return (
    <div className="account-page">
      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}
      {returnTarget && (
        <ReturnModal
          order={returnTarget.order}
          type={returnTarget.type}
          onClose={() => setReturnTarget(null)}
          onSubmit={handleReturnSubmit}
          loading={returnLoading}
        />
      )}

      <div className="account-header">
        <div>
          <span className="account-eyebrow">MAYURA REGALIA</span>
          <h1>My Account</h1>
          <p>Welcome back, {customer?.name || 'there'}.</p>
        </div>
        <button className="account-logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="account-orders-toolbar">
        <h2>Order History</h2>
        <div className="account-range-toggle">
          <button
            className={range === '6months' ? 'active' : ''}
            onClick={() => setRange('6months')}
          >
            Last 6 months
          </button>
          <button
            className={range === 'all' ? 'active' : ''}
            onClick={() => setRange('all')}
          >
            All orders
          </button>
        </div>
      </div>

      {loading && <div className="account-state">Loading your orders...</div>}
      {!loading && error && <div className="account-state account-state-error">{error}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="account-state">
          No orders found {range === '6months' ? 'in the last 6 months' : ''}.
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="account-orders-list">
          {orders.map((order) => {
            const isCancellable = ['pending', 'processing'].includes(order.orderStatus);
            const isDelivered = order.orderStatus === 'delivered';
            const withinReturnWindow = isDelivered && daysSince(order.updatedAt) <= 10;

            return (
              <div className="account-order-card" key={order.id}>
                <div className="account-order-top">
                  <div>
                    <span className="account-order-number">{order.orderNumber}</span>
                    <span className="account-order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="account-order-status">
                    <span className={`status-pill status-${order.orderStatus}`}>{order.orderStatus}</span>
                    <span className={`status-pill status-${order.paymentStatus}`}>{order.paymentStatus}</span>
                  </div>
                </div>

                {/* Delivery address */}
                {(order.address || order.city) && (
                  <div className="account-order-address">
                    <span className="account-order-address-label">📦 Delivery address:</span>{' '}
                    {[order.address, order.city, order.state, order.pincode].filter(Boolean).join(', ')}
                  </div>
                )}

                <div className="account-order-items">
                  {(order.items || []).map((item) => (
                    <div className="account-order-item" key={item.id}>
                      {item.image && <img src={item.image} alt={item.productName} />}
                      <div>
                        <p className="item-name">{item.productName}</p>
                        <p className="item-meta">Qty {item.quantity} · ₹{Number(item.price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="account-order-bottom">
                  <Link className="account-track-link" to={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}>Track order</Link>
                  <span>Total</span>
                  <strong>₹{Number(order.total).toLocaleString('en-IN')}</strong>
                </div>

                {/* Action buttons */}
                <div className="account-order-actions">
                  {isCancellable && !cancelMsg[order.id] && (
                    <button
                      className="account-action-btn account-cancel-btn"
                      onClick={() => setCancelTarget(order)}
                    >
                      Cancel Order
                    </button>
                  )}
                  {withinReturnWindow && !returnMsg[order.id] && (
                    <>
                      <button
                        className="account-action-btn account-return-btn"
                        onClick={() => setReturnTarget({ order, type: 'return' })}
                      >
                        Return
                      </button>
                      <button
                        className="account-action-btn account-replace-btn"
                        onClick={() => setReturnTarget({ order, type: 'replace' })}
                      >
                        Replace
                      </button>
                    </>
                  )}
                  {isDelivered && !withinReturnWindow && (
                    <span className="account-return-expired">Return window expired (10-day policy)</span>
                  )}
                </div>

                {/* Feedback messages */}
                {cancelMsg[order.id] && (
                  <p className="account-action-msg">{cancelMsg[order.id]}</p>
                )}
                {returnMsg[order.id] && (
                  <p className="account-action-msg">{returnMsg[order.id]}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerAccount;

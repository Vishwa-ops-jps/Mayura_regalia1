import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ordersApi } from '../services/adminApi';
import { formatCurrency, formatDate } from '../utils';
import AdminIcon from '../components/AdminIcon';

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const Orders = () => {
  const [shipForm, setShipForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '' });
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set('status', statusFilter);
      if (search) query.set('search', search);
      const qs = query.toString();
      const data = await ordersApi.list(qs ? `?${qs}` : '');
      setOrders(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const totals = useMemo(() => ({
    revenue: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
    count: orders.length,
  }), [orders]);

  const updateStatus = async (order, field, value) => {
    setUpdatingId(order.id);
    setMessage('');
    setError('');
    try {
      await ordersApi.updateStatus(order.id, { [field]: value });
      setMessage(`Order ${order.orderNumber} updated.`);
      await load();
      if (viewing?.id === order.id) setViewing({ ...viewing, [field]: value });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openOrder = (o) => {
    setViewing(o);
    setShipForm({ courierName: o.courierName || '', trackingNumber: o.trackingNumber || '', trackingUrl: o.trackingUrl || '' });
  };

  const saveShipping = async () => {
    setUpdatingId(viewing.id);
    setMessage('');
    setError('');
    try {
      const updated = await ordersApi.updateStatus(viewing.id, shipForm);
      setViewing({ ...viewing, ...updated });
      setMessage(`Shipping details saved for ${viewing.orderNumber}. They appear on the customer's tracking page and in the "shipped" email.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteOrder = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    try {
      await ordersApi.remove(order.id);
      setMessage('Order deleted.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="stats-grid">
        <div className="stat-card"><span>Orders Shown</span><strong>{totals.count}</strong><em>Matching filters</em></div>
        <div className="stat-card"><span>Revenue Shown</span><strong>{formatCurrency(totals.revenue)}</strong><em>Sum of totals</em></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order #, customer, email..." /></div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>ORDERS</span><h2>{orders.length} orders</h2></div></div>
        {loading ? <div className="admin-loading">Loading orders...</div> : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th>PAYMENT</th><th>DATE</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>{o.customerName}<br /><small>{o.email}</small></td>
                    <td>{o.items?.length || 0}</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td>
                      <select className="status-select" value={o.orderStatus} disabled={updatingId === o.id} onChange={(e) => updateStatus(o, 'orderStatus', e.target.value)}>
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="status-select" value={o.paymentStatus} disabled={updatingId === o.id} onChange={(e) => updateStatus(o, 'paymentStatus', e.target.value)}>
                        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      <button className="table-action edit" onClick={() => openOrder(o)}>View</button>
                      <button className="table-action delete" onClick={() => deleteOrder(o)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && <div className="empty-table">No orders found.</div>}
          </div>
        )}
      </div>

      {viewing && (
        <div className="modal-backdrop" onMouseDown={() => setViewing(null)}>
          <div className="product-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-heading"><div><span>ORDER DETAILS</span><h2>{viewing.orderNumber}</h2></div><button onClick={() => setViewing(null)}>×</button></div>
            <div className="product-form">
              <ul className="detail-list">
                <li><span>Customer</span><span>{viewing.customerName}</span></li>
                <li><span>Email</span><span>{viewing.email || '—'}</span></li>
                <li><span>Phone</span><span>{viewing.phone || '—'}</span></li>
                <li><span>Address</span><span>{[viewing.address, viewing.city, viewing.state, viewing.pincode].filter(Boolean).join(', ') || '—'}</span></li>
                <li><span>Payment method</span><span>{viewing.paymentMethod}</span></li>
                <li><span>Coupon</span><span>{viewing.couponCode || '—'}</span></li>
                <li><span>Subtotal</span><span>{formatCurrency(viewing.subtotal)}</span></li>
                <li><span>Discount</span><span>-{formatCurrency(viewing.discount)}</span></li>
                <li><span>Shipping</span><span>{formatCurrency(viewing.shippingFee)}</span></li>
                <li><span>Total</span><span><strong>{formatCurrency(viewing.total)}</strong></span></li>
              </ul>
              <div className="shipping-box" style={{ marginTop: 16, padding: 14, border: '1px solid #e5d9b6', borderRadius: 10, background: '#fffdf7' }}>
                <strong>Shipping / tracking details</strong>
                <small style={{ display: 'block', color: '#777', margin: '4px 0 10px' }}>Add these when you hand the parcel to the courier, then set the status to Shipped. The customer sees them on the tracking page and in the email.</small>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <label>Courier<input value={shipForm.courierName} onChange={(e) => setShipForm({ ...shipForm, courierName: e.target.value })} placeholder="e.g. Delhivery, India Post" /></label>
                  <label>Tracking number<input value={shipForm.trackingNumber} onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })} /></label>
                  <label style={{ gridColumn: '1 / -1' }}>Tracking link (optional)<input value={shipForm.trackingUrl} onChange={(e) => setShipForm({ ...shipForm, trackingUrl: e.target.value })} placeholder="https://..." /></label>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="save-btn" disabled={updatingId === viewing.id} onClick={saveShipping}>Save shipping details</button>
                  <span style={{ fontSize: '0.85rem', color: '#777' }}>Status: {viewing.orderStatus}</span>
                </div>
              </div>
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table className="admin-table">
                  <thead><tr><th>ITEM</th><th>PRICE</th><th>QTY</th><th>SUBTOTAL</th></tr></thead>
                  <tbody>
                    {(viewing.items || []).map((it) => (
                      <tr key={it.id}><td>{it.productName}</td><td>{formatCurrency(it.price)}</td><td>{it.quantity}</td><td>{formatCurrency(it.subtotal)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Orders;

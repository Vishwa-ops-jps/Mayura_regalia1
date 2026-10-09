import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { paymentsApi } from '../services/adminApi';
import { formatCurrency, formatDate } from '../utils';
import AdminIcon from '../components/AdminIcon';

const STATUSES = ['pending', 'paid', 'failed', 'refunded'];

// Swaps a proof-image thumbnail that fails to load for a plain "broken"
// label instead of the browser's default broken-image icon, so a bad/corrupt
// value is obvious rather than looking like the page is still loading it.
const ProofThumb = ({ src }) => {
  const [failed, setFailed] = useState(false);
  if (!src) return '—';
  if (failed) return <span className="proof-broken" title="Image failed to load"><AdminIcon name="warning" size={14} /> broken</span>;
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt="Payment proof" className="payment-proof-thumb" onError={() => setFailed(true)} />
    </a>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      setPayments(await paymentsApi.list(qs));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return payments;
    return payments.filter((p) => `${p.orderNumber} ${p.customerName || ''}`.toLowerCase().includes(term));
  }, [payments, search]);

  const totalCollected = useMemo(() => payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0), [payments]);
  const totalPending = useMemo(() => payments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0), [payments]);

  const updateStatus = async (payment, status) => {
    setUpdatingId(payment.id);
    setMessage('');
    setError('');
    try {
      await paymentsApi.updateStatus(payment.id, { status });
      setMessage(`Payment for ${payment.orderNumber} marked ${status}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <div className="stats-grid">
        <div className="stat-card"><span>Collected</span><strong>{formatCurrency(totalCollected)}</strong><em>Paid payments</em></div>
        <div className="stat-card"><span>Pending</span><strong>{formatCurrency(totalPending)}</strong><em>Awaiting settlement</em></div>
        <div className="stat-card"><span>Total Records</span><strong>{payments.length}</strong><em>All payments</em></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or customer..." /></div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>PAYMENTS</span><h2>{filtered.length} records</h2></div></div>
        {loading ? <div className="admin-loading">Loading payments...</div> : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>AMOUNT</th><th>METHOD</th><th>TXN ID</th><th>PROOF</th><th>STATUS</th><th>ACTION</th><th>DATE</th></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.orderNumber}</td>
                    <td>{p.customerName || '—'}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.transactionId || '—'}</td>
                    <td><ProofThumb src={p.proofImage} /></td>
                    <td>
                      <select className="status-select" value={p.status} disabled={updatingId === p.id} onChange={(e) => updateStatus(p, e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="payment-approve-actions">
                        <button
                          type="button"
                          className="icon-btn approve"
                          title="Approve payment"
                          disabled={updatingId === p.id || p.status === 'paid'}
                          onClick={() => updateStatus(p, 'paid')}
                        ><AdminIcon name="success" size={15} /></button>
                        <button
                          type="button"
                          className="icon-btn reject"
                          title="Reject payment"
                          disabled={updatingId === p.id || p.status === 'failed'}
                          onClick={() => updateStatus(p, 'failed')}
                        ><AdminIcon name="cancel" size={15} /></button>
                      </div>
                    </td>
                    <td>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <div className="empty-table">No payments found.</div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default Payments;

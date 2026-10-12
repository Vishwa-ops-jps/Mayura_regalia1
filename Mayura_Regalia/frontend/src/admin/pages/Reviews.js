import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { reviewsApi } from '../services/adminApi';
import { formatDate } from '../utils';
import AdminIcon from '../components/AdminIcon';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      setReviews(await reviewsApi.list(qs));
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
    if (!term) return reviews;
    return reviews.filter((r) => `${r.customerName} ${r.productName || ''} ${r.comment || ''}`.toLowerCase().includes(term));
  }, [reviews, search]);

  const setStatus = async (review, status) => {
    setBusyId(review.id);
    setMessage('');
    setError('');
    try {
      await reviewsApi.updateStatus(review.id, status);
      setMessage(`Review ${status}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewsApi.remove(review.id);
      setMessage('Review deleted.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <section>
      <div className="stats-grid">
        <div className="stat-card"><span>Total Reviews</span><strong>{reviews.length}</strong><em>All time</em></div>
        <div className="stat-card"><span>Pending</span><strong>{pendingCount}</strong><em>Awaiting moderation</em></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." /></div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>REVIEWS</span><h2>{filtered.length} reviews</h2></div></div>
        {loading ? <div className="admin-loading">Loading reviews...</div> : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>PRODUCT</th><th>CUSTOMER</th><th>RATING</th><th>COMMENT</th><th>STATUS</th><th>DATE</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.productName || '—'}</td>
                    <td>{r.customerName}</td>
                    <td><AdminIcon name="rating" size={14} /> {Number(r.rating).toFixed(1)}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 260 }}>{r.comment}</td>
                    <td><span className={`status-pill ${r.status}`}>{r.status}</span></td>
                    <td>{formatDate(r.createdAt)}</td>
                    <td>
                      {r.status !== 'approved' && <button className="table-action edit" disabled={busyId === r.id} onClick={() => setStatus(r, 'approved')}>Approve</button>}
                      {r.status !== 'rejected' && <button className="table-action delete" disabled={busyId === r.id} onClick={() => setStatus(r, 'rejected')}>Reject</button>}
                      <button className="table-action delete" onClick={() => remove(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <div className="empty-table">No reviews found.</div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default Reviews;

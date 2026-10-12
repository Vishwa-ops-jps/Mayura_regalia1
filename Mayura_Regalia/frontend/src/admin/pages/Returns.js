import React, { useCallback, useEffect, useState } from 'react';
import { returnsApi } from '../services/adminApi';
import { formatCurrency, formatDate } from '../utils';
import AdminIcon from '../components/AdminIcon';

const STATUSES = ['pending', 'approved', 'rejected', 'completed'];

const Returns = () => {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (status) query.set('status', status);
      if (search) query.set('search', search);
      const qs = query.toString();
      setRequests(await returnsApi.list(qs ? `?${qs}` : ''));
      setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const update = async (request, nextStatus) => {
    setSavingId(request.id);
    setMessage('');
    setError('');
    try {
      await returnsApi.update(request.id, { status: nextStatus });
      setMessage(`${request.type === 'replace' ? 'Replacement' : 'Return'} request for ${request.orderNumber} marked ${nextStatus}.`);
      await load();
    } catch (err) { setError(err.message); }
    finally { setSavingId(null); }
  };

  return (
    <section>
      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or customer..." /></div>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
        </select>
      </div>
      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>AFTER-SALES</span><h2>{requests.length} return requests</h2></div></div>
        {loading ? <div className="admin-loading">Loading return requests...</div> : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>ORDER</th><th>TYPE</th><th>CUSTOMER</th><th>REASON</th><th>AMOUNT</th><th>STATUS</th><th>DATE</th></tr></thead>
              <tbody>{requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.orderNumber}</td>
                  <td>{request.type === 'replace' ? 'Replacement' : 'Return'}</td>
                  <td>{request.customerName}<br /><small>{request.email || request.phone || '—'}</small></td>
                  <td title={request.reason}>{request.reason || '—'}</td>
                  <td>{formatCurrency(request.total)}</td>
                  <td><select className="status-select" value={request.status} disabled={savingId === request.id} onChange={(e) => update(request, e.target.value)}>
                    {STATUSES.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
                  </select></td>
                  <td>{formatDate(request.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
            {!requests.length && <div className="empty-table">No return or exchange requests found.</div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default Returns;

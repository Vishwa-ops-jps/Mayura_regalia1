import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { inventoryApi } from '../services/adminApi';
import { onImageError } from '../utils';
import AdminIcon from '../components/AdminIcon';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [edits, setEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.list();
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let rows = items;
    if (filter === 'low') rows = rows.filter((r) => r.isLowStock);
    if (filter === 'out') rows = rows.filter((r) => !r.inStock);
    const term = search.toLowerCase().trim();
    if (term) rows = rows.filter((r) => `${r.name} ${r.category} ${r.sku || ''}`.toLowerCase().includes(term));
    return rows;
  }, [items, search, filter]);

  const setEdit = (id, value) => setEdits((current) => ({ ...current, [id]: value }));

  const saveStock = async (item) => {
    const value = edits[item.id] ?? item.stockQuantity;
    setSavingId(item.id);
    setMessage('');
    setError('');
    try {
      await inventoryApi.adjust(item.id, { stockQuantity: Number(value), lowStockThreshold: item.lowStockThreshold });
      setMessage(`Updated stock for ${item.name}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const lowCount = items.filter((r) => r.isLowStock).length;
  const outCount = items.filter((r) => !r.inStock).length;

  return (
    <section>
      <div className="stats-grid">
        <div className="stat-card"><span>Total SKUs</span><strong>{items.length}</strong><em>Tracked products</em></div>
        <div className="stat-card"><span>Low Stock</span><strong>{lowCount}</strong><em>Below threshold</em></div>
        <div className="stat-card"><span>Out of Stock</span><strong>{outCount}</strong><em>Needs restock</em></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or SKU..." /></div>
        <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>STOCK LEVELS</span><h2>{filtered.length} items</h2></div></div>
        {loading ? <div className="admin-loading">Loading inventory...</div> : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>THRESHOLD</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><div className="table-product"><img src={item.image || `/products/${String(item.category || 'regalia-5').toLowerCase().replace(/\s+/g, '-')}.jpg`} alt="" onError={onImageError} /><strong>{item.name}</strong></div></td>
                    <td>{item.sku || '—'}</td>
                    <td>{item.category}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td>
                      <input
                        type="number" min="0" style={{ width: 70 }}
                        value={edits[item.id] ?? item.stockQuantity}
                        onChange={(e) => setEdit(item.id, e.target.value)}
                      />
                    </td>
                    <td>
                      <span className={`status-pill ${!item.inStock ? 'out' : item.isLowStock ? 'pending' : 'in'}`}>
                        {!item.inStock ? 'Out of stock' : item.isLowStock ? 'Low stock' : 'In stock'}
                      </span>
                    </td>
                    <td><button className="admin-btn small primary" disabled={savingId === item.id} onClick={() => saveStock(item)}>{savingId === item.id ? 'Saving...' : 'Update'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <div className="empty-table">No inventory items found.</div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default Inventory;

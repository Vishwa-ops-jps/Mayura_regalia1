import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { apiRequest } from '../../services/api';
import '../styles/AdminDashboard.css';

const emptyProduct = {
  name: '', category: 'Necklaces', price: '', originalPrice: '', discount: 0,
  rating: 4.5, material: 'Premium Alloy', color: 'Gold', inStock: true,
  description: '', image: '/products/regalia-1.jpg',
};

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const admin = authService.getAdmin();
  const [active, setActive] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAuthenticated = authService.isAuthenticated();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/products');
      setProducts(data);
      setError('');
    } catch (err) {
      setError(`Could not load MySQL products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return products;
    return products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(term));
  }, [products, search]);

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  const lowStock = products.filter((p) => p.inStock === false).length;
  const inStockCount = products.length - lowStock;
  const averageRating = products.length
    ? (products.reduce((sum, p) => sum + Number(p.rating || 0), 0) / products.length).toFixed(1)
    : '0.0';
  const inventoryValue = products.reduce((sum, p) => sum + (p.inStock ? Number(p.price || 0) : 0), 0);
  const averagePrice = products.length
    ? Math.round(products.reduce((sum, p) => sum + Number(p.price || 0), 0) / products.length)
    : 0;
  const categoryBreakdown = (() => {
    const counts = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }));
  })();

  const openAdd = () => {
    setEditing(null);
    setForm(emptyProduct);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({ ...product });
    setError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const path = editing ? `/products/${editing.id}` : '/products';
      const method = editing ? 'PUT' : 'POST';
      await apiRequest(path, { method, headers: { Authorization: `Bearer ${authService.getToken()}` }, body: JSON.stringify(form) });
      setModalOpen(false);
      setMessage(editing ? 'Product updated in MySQL.' : 'Product added to MySQL.');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete “${product.name}”? This will remove it from MySQL.`)) return;
    try {
      await apiRequest(`/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      setMessage('Product deleted from MySQL.');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    authService.logout();
    navigate('/admin/login', { replace: true });
  };

  const menu = [
    ['dashboard', '▦', 'Dashboard'],
    ['products', '◇', 'Products'],
    ['orders', '▤', 'Orders'],
    ['customers', '♙', 'Customers'],
    ['categories', '◈', 'Categories'],
    ['settings', '⚙', 'Settings'],
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/LOGO_Mayura_Regalia.png" alt="Mayura Regalia" />
          <span>ADMIN PANEL</span>
        </div>
        <nav>
          {menu.map(([key, icon, label]) => (
            <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={logout}>↪ Logout</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-mobile-label">MAYURA REGALIA</span>
            <h1>{active === 'dashboard' ? 'Dashboard Overview' : active[0].toUpperCase() + active.slice(1)}</h1>
          </div>
          <div className="admin-profile">
            <span className="notification-dot">♧</span>
            <div className="avatar">M</div>
            <div><strong>{admin?.name || 'Admin'}</strong><small>Administrator</small></div>
          </div>
        </header>

        {message && <div className="admin-success">✓ {message}</div>}
        {error && !modalOpen && <div className="admin-error">{error}</div>}

        {active === 'dashboard' && (
          <section>
            <div className="stats-grid">
              <div className="stat-card"><span>Total Products</span><strong>{products.length}</strong><em>Live in store</em></div>
              <div className="stat-card"><span>In Stock</span><strong>{inStockCount}</strong><em>Ready to sell</em></div>
              <div className="stat-card"><span>Out of Stock</span><strong>{lowStock}</strong><em>Needs attention</em></div>
              <div className="stat-card"><span>Categories</span><strong>{categories.length}</strong><em>Product collections</em></div>
              <div className="stat-card"><span>Average Rating</span><strong>★ {averageRating}</strong><em>Customer rating</em></div>
              <div className="stat-card"><span>Average Price</span><strong>{formatCurrency(averagePrice)}</strong><em>Per product</em></div>
              <div className="stat-card"><span>Inventory Value</span><strong>{formatCurrency(inventoryValue)}</strong><em>In-stock total</em></div>
            </div>

            <div className="dashboard-grid">
              <div className="admin-panel-card chart-card">
                <div className="panel-heading"><div><span>LIVE BREAKDOWN</span><h2>Products by category</h2></div><button onClick={() => setActive('products')}>Manage products →</button></div>
                {categoryBreakdown.length ? (
                  <div className="activity-bars">
                    {categoryBreakdown.map(({ name, count, pct }) => (
                      <div key={name} className="activity-col">
                        <div style={{ height: `${Math.max(pct, 6)}%` }} title={`${count} products`} />
                        <small>{name}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-table">No products yet.</div>
                )}
              </div>
              <div className="admin-panel-card quick-card">
                <div className="panel-heading"><div><span>QUICK ACTIONS</span><h2>Store controls</h2></div></div>
                <button onClick={openAdd}>＋ Add New Product</button>
                <button onClick={() => setActive('products')}>◇ Edit Catalogue</button>
                <button onClick={() => setActive('categories')}>◈ View Categories</button>
              </div>
            </div>

            <div className="admin-panel-card table-card">
              <div className="panel-heading"><div><span>RECENT CATALOGUE</span><h2>Products</h2></div><button onClick={() => setActive('products')}>View all</button></div>
              <ProductTable products={products.slice(0, 6)} onEdit={openEdit} onDelete={deleteProduct} />
            </div>
          </section>
        )}

        {active === 'products' && (
          <section>
            <div className="product-toolbar">
              <div className="admin-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /></div>
              <button className="add-product-btn" onClick={openAdd}>＋ Add Product</button>
            </div>
            <div className="admin-panel-card table-card">
              <div className="panel-heading"><div><span>CATALOGUE</span><h2>{filteredProducts.length} products</h2></div><small>Changes are saved directly to MySQL</small></div>
              {loading ? <div className="admin-loading">Loading products from MySQL...</div> : <ProductTable products={filteredProducts} onEdit={openEdit} onDelete={deleteProduct} />}
            </div>
          </section>
        )}

        {active !== 'dashboard' && active !== 'products' && (
          <div className="admin-coming-soon"><div>✦</div><h2>{active[0].toUpperCase() + active.slice(1)} module</h2><p>This section is ready for the next MVP phase. Product management and admin authentication are fully connected to MySQL.</p></div>
        )}
      </main>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div className="product-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-heading"><div><span>{editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</span><h2>{editing ? 'Update jewellery' : 'Add a product'}</h2></div><button onClick={() => setModalOpen(false)}>×</button></div>
            <form onSubmit={saveProduct} className="product-form">
              <div className="form-grid">
                <label>Product name<input name="name" value={form.name} onChange={handleChange} required /></label>
                <label>Category<input name="category" value={form.category} onChange={handleChange} required /></label>
                <label>Price (₹)<input name="price" type="number" min="0" value={form.price} onChange={handleChange} required /></label>
                <label>Original price (₹)<input name="originalPrice" type="number" min="0" value={form.originalPrice ?? ''} onChange={handleChange} /></label>
                <label>Discount (%)<input name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleChange} /></label>
                <label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={handleChange} /></label>
                <label>Material<input name="material" value={form.material || ''} onChange={handleChange} /></label>
                <label>Color<input name="color" value={form.color || ''} onChange={handleChange} /></label>
                <label className="full-width">Image path<input name="image" value={form.image || ''} onChange={handleChange} placeholder="/products/regalia-1.jpg" /></label>
                <label className="full-width">Description<textarea name="description" rows="4" value={form.description || ''} onChange={handleChange} /></label>
              </div>
              <label className="stock-toggle"><input name="inStock" type="checkbox" checked={Boolean(form.inStock)} onChange={handleChange} /> Product is in stock</label>
              {error && <div className="login-error">{error}</div>}
              <div className="modal-actions"><button type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="save-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductTable = ({ products, onEdit, onDelete }) => (
  <div className="table-wrap">
    <table className="admin-table">
      <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>RATING</th><th>ACTIONS</th></tr></thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td><div className="table-product"><img src={p.image} alt="" /><div><strong>{p.name}</strong><small>#{String(p.id).padStart(4, '0')}</small></div></div></td>
            <td>{p.category}</td><td>{formatCurrency(p.price)}</td>
            <td><span className={`stock-pill ${p.inStock ? 'in' : 'out'}`}>{p.inStock ? 'Active' : 'Out of stock'}</span></td>
            <td>★ {Number(p.rating).toFixed(1)}</td>
            <td><button className="table-action edit" onClick={() => onEdit(p)}>Edit</button><button className="table-action delete" onClick={() => onDelete(p)}>Delete</button></td>
          </tr>
        ))}
      </tbody>
    </table>
    {!products.length && <div className="empty-table">No products found.</div>}
  </div>
);

export default AdminDashboard;

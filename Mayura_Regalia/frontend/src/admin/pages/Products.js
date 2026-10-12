import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { productsApi, categoriesApi } from '../services/adminApi';
import { formatCurrency, onImageError } from '../utils';
import AdminIcon from '../components/AdminIcon';

const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const COLOR_OPTIONS = [
  'Gold', 'Rose Gold', 'Silver', 'Antique Gold', 'Oxidised Silver',
  'Platinum', 'Copper', 'Multicolour',
];

const DEFAULT_CATEGORIES = [
  'Silver', 'German Silver', 'Gold Jewellery', 'Necklaces', 'Earrings',
  'Bangles', 'Rings', 'Bridal Jewellery', 'Bracelets', 'Sarees', 'Bags', 'Watches', 'Gifts',
];

const CATEGORY_IMAGE_FALLBACKS = {
  necklaces: '/products/regalia-1.jpg',
  earrings: '/products/earrings-green-jhumka.jpg',
  bangles: '/products/bangles-gemstone-kada.jpg',
  rings: '/products/regalia-3.jpg',
  'bridal jewellery': '/products/JewelsSet.jpeg',
  bracelets: '/products/regalia-4.jpg',
  sarees: '/products/saree-wine-velvet.jpg',
  bags: '/products/mayura-purse-01.jpg',
  gifts: '/products/fashion-jewels-2.jpg',
  silver: '/products/regalia-6.jpg',
  'german silver': '/products/regalia-7.jpg',
  'gold jewellery': '/products/JewelsSet.jpeg',
};

const productImage = (product) => product.image || CATEGORY_IMAGE_FALLBACKS[String(product.category || '').toLowerCase()] || '/products/regalia-5.jpg';

const emptyProduct = {
  name: '', category: '', price: '', originalPrice: '', discount: 0,
  rating: 4.5, material: 'Premium Alloy', colors: ['Gold'], inStock: true,
  description: '', image: '', images: [], sku: '', stockQuantity: 0, lowStockThreshold: 5,
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that image file'));
    reader.readAsDataURL(file);
  });
}

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.list();
      setProducts(data);
      setError('');
    } catch (err) {
      setError(`Could not load MySQL products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.list();
      setCategories((data || []).filter((c) => c.status !== 'inactive'));
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => { loadProducts(); loadCategories(); }, [loadProducts, loadCategories]);

  // Combine categories from backend with default categories to always provide Silver & German Silver
  const availableCategoryNames = useMemo(() => {
    const names = new Set(categories.map((c) => c.name));
    DEFAULT_CATEGORIES.forEach((c) => names.add(c));
    return Array.from(names);
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return products;
    return products.filter((p) => `${p.name} ${p.category} ${p.sku || ''}`.toLowerCase().includes(term));
  }, [products, search]);

  const defaultCategory = availableCategoryNames[0] || 'Silver';

  const openAdd = () => {
    setEditing(null);
    setImageUrlInput('');
    setForm({ ...emptyProduct, category: defaultCategory, images: [] });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setImageUrlInput('');
    let imgs = [];
    if (Array.isArray(product.images)) imgs = product.images.filter(Boolean);
    else if (typeof product.images === 'string') {
      try { imgs = JSON.parse(product.images); } catch { imgs = product.images ? [product.images] : []; }
    }
    if (!imgs.length && product.image) imgs = [product.image];

    setForm({
      ...emptyProduct,
      ...product,
      image: imgs[0] || product.image || '',
      images: imgs,
      colors: Array.isArray(product.colors) && product.colors.length
        ? product.colors
        : (product.color ? [product.color] : []),
    });
    setError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleColor = (colorName) => {
    setForm((current) => {
      const has = current.colors.includes(colorName);
      const colors = has ? current.colors.filter((c) => c !== colorName) : [...current.colors, colorName];
      return { ...current, colors };
    });
  };

  const handleMultipleImageFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setForm((current) => {
        const currentList = Array.isArray(current.images) ? current.images : (current.image ? [current.image] : []);
        const updatedImages = [...currentList, ...dataUrls];
        return {
          ...current,
          images: updatedImages,
          image: updatedImages[0] || current.image || '',
        };
      });
      e.target.value = '';
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddImageUrl = (e) => {
    if (e) e.preventDefault();
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setForm((current) => {
      const currentList = Array.isArray(current.images) ? current.images : (current.image ? [current.image] : []);
      const updatedImages = [...currentList, trimmed];
      return {
        ...current,
        images: updatedImages,
        image: updatedImages[0] || current.image || '',
      };
    });
    setImageUrlInput('');
  };

  const handleSetPrimaryImage = (index) => {
    setForm((current) => {
      const list = [...(current.images || [])];
      if (index < 0 || index >= list.length) return current;
      const [chosen] = list.splice(index, 1);
      const reordered = [chosen, ...list];
      return {
        ...current,
        image: chosen,
        images: reordered,
      };
    });
  };

  const handleRemoveImage = (index) => {
    setForm((current) => {
      const updated = (current.images || []).filter((_, i) => i !== index);
      return {
        ...current,
        images: updated,
        image: updated[0] || '',
      };
    });
  };

  const handleMoveImage = (index, direction) => {
    setForm((current) => {
      const list = [...(current.images || [])];
      const target = index + direction;
      if (target < 0 || target >= list.length) return current;
      const temp = list[index];
      list[index] = list[target];
      list[target] = temp;
      return {
        ...current,
        image: list[0] || '',
        images: list,
      };
    });
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!form.colors.length) {
        throw new Error('Pick at least one available colour');
      }
      const imgs = Array.isArray(form.images) ? form.images.filter(Boolean) : [];
      const primary = imgs[0] || form.image || '';
      const payload = {
        ...form,
        image: primary,
        images: imgs.length ? imgs : (primary ? [primary] : []),
      };

      if (editing) {
        await productsApi.update(editing.id, payload);
        setMessage('Product updated in MySQL.');
      } else {
        await productsApi.create(payload);
        setMessage('Product added to MySQL.');
      }
      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This will remove it from MySQL.`)) return;
    try {
      await productsApi.remove(product.id);
      setMessage('Product deleted from MySQL.');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="product-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU..." /></div>
        <button className="add-product-btn" onClick={openAdd}><AdminIcon name="add" size={16} /> Add Product</button>
      </div>

      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && !modalOpen && <div className="admin-error">{error}</div>}

      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>CATALOGUE</span><h2>{filteredProducts.length} products</h2></div><small>Changes are saved directly to MySQL</small></div>
        {loading ? <div className="admin-loading">Loading products from MySQL...</div> : <ProductTable products={filteredProducts} onEdit={openEdit} onDelete={deleteProduct} />}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div className="product-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-heading"><div><span>{editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</span><h2>{editing ? 'Update jewellery' : 'Add a product'}</h2></div><button onClick={() => setModalOpen(false)}>×</button></div>
            <form onSubmit={saveProduct} className="product-form">
              <div className="form-grid">
                <label>Product name<input name="name" value={form.name} onChange={handleChange} required /></label>

                <label>Category
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="" disabled>Select a category</option>
                    {availableCategoryNames.map((catName) => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
                  </select>
                </label>

                <label>SKU<input name="sku" value={form.sku || ''} onChange={handleChange} placeholder="MR-NK-001" /></label>
                <label>Price (₹)<input name="price" type="number" min="0" value={form.price} onChange={handleChange} required /></label>
                <label>Original price (₹)<input name="originalPrice" type="number" min="0" value={form.originalPrice ?? ''} onChange={handleChange} /></label>

                <label>Discount
                  <select name="discount" value={form.discount} onChange={handleChange}>
                    {DISCOUNT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d === 0 ? 'No discount' : `${d}% off`}</option>
                    ))}
                  </select>
                </label>

                <label>Stock quantity<input name="stockQuantity" type="number" min="0" value={form.stockQuantity ?? 0} onChange={handleChange} /></label>
                <label>Low stock alert below<input name="lowStockThreshold" type="number" min="0" value={form.lowStockThreshold ?? 5} onChange={handleChange} /></label>
                <label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={handleChange} /></label>
                <label>Material<input name="material" value={form.material || ''} onChange={handleChange} /></label>

                <label className="full-width">Available colours
                  <div className="color-options">
                    {COLOR_OPTIONS.map((c) => (
                      <label key={c} className={`color-chip ${form.colors.includes(c) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.colors.includes(c)}
                          onChange={() => toggleColor(c)}
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </label>

                <div className="full-width product-images-manager">
                  <label className="images-section-title">
                    Product Images ({form.images?.length || (form.image ? 1 : 0)} uploaded)
                    <span className="images-subnote">Upload multiple images. The first image is the catalogue cover.</span>
                  </label>
                  
                  <div className="image-upload-row">
                    <label className="file-input-label">
                      <span>📁 Select Multiple Images</span>
                      <input type="file" accept="image/*" multiple onChange={handleMultipleImageFiles} />
                    </label>
                  </div>

                  <div className="image-add-url-row">
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or paste an image URL/path (e.g. /products/regalia-1.jpg)"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
                    />
                    <button type="button" onClick={handleAddImageUrl}>+ Add URL</button>
                  </div>

                  {Array.isArray(form.images) && form.images.length > 0 ? (
                    <div className="product-images-gallery">
                      {form.images.map((imgUrl, idx) => (
                        <div key={idx} className={`image-thumb-card ${idx === 0 ? 'is-primary' : ''}`}>
                          <img src={imgUrl} alt={`Product thumbnail ${idx + 1}`} onError={onImageError} />
                          {idx === 0 && <span className="image-thumb-badge">PRIMARY</span>}
                          <div className="image-thumb-actions">
                            {idx > 0 && (
                              <button
                                type="button"
                                className="thumb-btn"
                                title="Move left"
                                onClick={() => handleMoveImage(idx, -1)}
                              >
                                ◀
                              </button>
                            )}
                            {idx !== 0 && (
                              <button
                                type="button"
                                className="thumb-btn star"
                                title="Set as primary image"
                                onClick={() => handleSetPrimaryImage(idx)}
                              >
                                <AdminIcon name="rating" size={13} />
                              </button>
                            )}
                            {idx < form.images.length - 1 && (
                              <button
                                type="button"
                                className="thumb-btn"
                                title="Move right"
                                onClick={() => handleMoveImage(idx, 1)}
                              >
                                ▶
                              </button>
                            )}
                            <button
                              type="button"
                              className="thumb-btn delete"
                              title="Remove image"
                              onClick={() => handleRemoveImage(idx)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : form.image ? (
                    <div className="product-images-gallery">
                      <div className="image-thumb-card is-primary">
                        <img src={form.image} alt="Product preview" onError={onImageError} />
                        <span className="image-thumb-badge">PRIMARY</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <label className="full-width">Description<textarea name="description" rows="4" value={form.description || ''} onChange={handleChange} /></label>
              </div>
              <label className="stock-toggle"><input name="inStock" type="checkbox" checked={Boolean(form.inStock)} onChange={handleChange} /> Product is in stock</label>
              {error && <div className="admin-error">{error}</div>}
              <div className="modal-actions"><button type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="save-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create product'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

const ProductTable = ({ products, onEdit, onDelete }) => (
  <div className="table-wrap">
    <table className="admin-table">
      <thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>RATING</th><th>ACTIONS</th></tr></thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td><div className="table-product"><img src={productImage(p)} alt="" onError={onImageError} /><div><strong>{p.name}</strong><small>{p.sku || `#${String(p.id).padStart(4, '0')}`}</small></div></div></td>
            <td>{p.category}</td><td>{formatCurrency(p.price)}</td>
            <td>{p.stockQuantity ?? 0}</td>
            <td><span className={`stock-pill ${p.inStock ? 'in' : 'out'}`}>{p.inStock ? 'Active' : 'Out of stock'}</span></td>
            <td><AdminIcon name="rating" size={14} /> {Number(p.rating).toFixed(1)}</td>
            <td><button className="table-action edit" onClick={() => onEdit(p)}>Edit</button><button className="table-action delete" onClick={() => onDelete(p)}>Delete</button></td>
          </tr>
        ))}
      </tbody>
    </table>
    {!products.length && <div className="empty-table">No products found.</div>}
  </div>
);

export default Products;

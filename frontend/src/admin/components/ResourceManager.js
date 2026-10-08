import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminIcon from './AdminIcon';

/**
 * Generic list + add/edit modal + delete admin screen, reused by Categories,
 * Collections, Gifts, Offers/Coupons and Banners so each module doesn't need
 * to reimplement the same CRUD boilerplate.
 */
const ResourceManager = ({
  api,
  title,
  subtitle,
  columns,
  formFields,
  emptyForm,
  searchKeys = ['name'],
  searchPlaceholder = 'Search...',
  idKey = 'id',
  buildPayload,
}) => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setRows(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return rows;
    return rows.filter((row) => searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(term)));
  }, [rows, search, searchKeys]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ ...emptyForm, ...row });
    setError('');
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = buildPayload ? buildPayload(form) : form;
      if (editing) {
        await api.update(editing[idKey], payload);
        setMessage(`${title} updated.`);
      } else {
        await api.create(payload);
        setMessage(`${title} created.`);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await api.remove(row[idKey]);
      setMessage(`${title} deleted.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <div className="admin-toolbar">
        <div className="admin-search"><AdminIcon name="search" size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} /></div>
        <button className="add-product-btn" onClick={openAdd}><AdminIcon name="add" size={16} /> Add {title}</button>
      </div>

      {message && <div className="admin-success"><AdminIcon name="success" size={16} /> {message}</div>}
      {error && !modalOpen && <div className="admin-error">{error}</div>}

      <div className="admin-panel-card table-card">
        <div className="panel-heading"><div><span>{(subtitle || `${title.toLowerCase()}s`).toUpperCase()}</span><h2>{filtered.length} {subtitle || `${title.toLowerCase()}s`}</h2></div></div>
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}<th>ACTIONS</th></tr></thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row[idKey]}>
                    {columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>)}
                    <td>
                      <button className="table-action edit" onClick={() => openEdit(row)}>Edit</button>
                      <button className="table-action delete" onClick={() => remove(row)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <div className="empty-table">Nothing here yet.</div>}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div className="product-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div><span>{editing ? `EDIT ${title.toUpperCase()}` : `NEW ${title.toUpperCase()}`}</span><h2>{editing ? `Update ${title.toLowerCase()}` : `Add a ${title.toLowerCase()}`}</h2></div>
              <button onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={save} className="product-form">
              <div className="form-grid">
                {formFields.map((field) => (
                  <label key={field.name} className={field.fullWidth ? 'full-width' : ''}>
                    {field.label}
                    {field.type === 'textarea' ? (
                      <textarea name={field.name} rows={field.rows || 3} value={form[field.name] ?? ''} onChange={handleChange} placeholder={field.placeholder} />
                    ) : field.type === 'select' ? (
                      <select name={field.name} value={form[field.name] ?? ''} onChange={handleChange}>
                        {field.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : field.type === 'checkbox' ? null : (
                      <input
                        name={field.name}
                        type={field.type || 'text'}
                        value={form[field.name] ?? ''}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                      />
                    )}
                  </label>
                ))}
              </div>
              {formFields.filter((f) => f.type === 'checkbox').map((field) => (
                <label key={field.name} className="stock-toggle">
                  <input name={field.name} type="checkbox" checked={Boolean(form[field.name])} onChange={handleChange} /> {field.label}
                </label>
              ))}
              {error && <div className="admin-error">{error}</div>}
              <div className="modal-actions">
                <button type="button" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="save-btn" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : `Create ${title.toLowerCase()}`}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default ResourceManager;

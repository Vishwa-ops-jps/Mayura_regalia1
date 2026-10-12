import React from 'react';
import ResourceManager from '../components/ResourceManager';
import { giftsApi } from '../services/adminApi';
import { formatCurrency, onImageError } from '../utils';

const emptyForm = { name: '', description: '', price: '', image: '', status: 'active' };
const giftImage = (row) => row.image || '/products/fashion-jewels-2.jpg';

const columns = [
  { key: 'image', label: 'IMAGE', render: (row) => <img className="resource-image-thumb" src={giftImage(row)} alt="" onError={onImageError} /> },
  { key: 'name', label: 'GIFT' },
  { key: 'price', label: 'PRICE', render: (row) => formatCurrency(row.price) },
  { key: 'status', label: 'STATUS', render: (row) => <span className={`status-pill ${row.status}`}>{row.status}</span> },
];

const formFields = [
  { name: 'name', label: 'Gift name', required: true },
  { name: 'price', label: 'Price (₹)', type: 'number', min: 0 },
  { name: 'image', label: 'Image path', placeholder: '/products/gift-wrap.jpg' },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const Gifts = () => (
  <ResourceManager
    api={giftsApi}
    title="Gift"
    subtitle="gift options"
    columns={columns}
    formFields={formFields}
    emptyForm={emptyForm}
    searchKeys={['name']}
    searchPlaceholder="Search gifts..."
  />
);

export default Gifts;

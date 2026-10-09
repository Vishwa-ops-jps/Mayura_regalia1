import React from 'react';
import ResourceManager from '../components/ResourceManager';
import { collectionsApi } from '../services/adminApi';
import { onImageError } from '../utils';

const emptyForm = { name: '', description: '', image: '', status: 'active' };
const collectionImage = (row) => row.image || '/products/regalia-5.jpg';

const columns = [
  { key: 'image', label: 'COVER', render: (row) => <img className="resource-image-thumb" src={collectionImage(row)} alt="" onError={onImageError} /> },
  { key: 'name', label: 'NAME' },
  { key: 'status', label: 'STATUS', render: (row) => <span className={`status-pill ${row.status}`}>{row.status}</span> },
  { key: 'productIds', label: 'PRODUCTS', render: (row) => (row.productIds || []).length },
];

const formFields = [
  { name: 'name', label: 'Collection name', required: true },
  { name: 'image', label: 'Cover image path', placeholder: '/products/regalia-5.jpg' },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const Collections = () => (
  <ResourceManager
    api={collectionsApi}
    title="Collection"
    subtitle="collections"
    columns={columns}
    formFields={formFields}
    emptyForm={emptyForm}
    searchKeys={['name', 'slug']}
    searchPlaceholder="Search collections..."
  />
);

export default Collections;

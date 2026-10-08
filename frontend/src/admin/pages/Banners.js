import React from 'react';
import ResourceManager from '../components/ResourceManager';
import { bannersApi } from '../services/adminApi';
import { onImageError } from '../utils';

const emptyForm = { title: '', subtitle: '', image: '', link: '', position: 'home_hero', status: 'active', sortOrder: 0 };

const columns = [
  { key: 'image', label: 'PREVIEW', render: (row) => <img className="banner-image-thumb" src={row.image || '/CoverImage1-wide.jpg'} alt="" onError={onImageError} /> },
  { key: 'title', label: 'TITLE' },
  { key: 'position', label: 'POSITION' },
  { key: 'status', label: 'STATUS', render: (row) => <span className={`status-pill ${row.status}`}>{row.status}</span> },
];

const formFields = [
  { name: 'title', label: 'Title', required: true },
  { name: 'subtitle', label: 'Subtitle' },
  { name: 'link', label: 'Link URL', placeholder: '/shop' },
  { name: 'image', label: 'Image path', placeholder: '/products/regalia-5.jpg', fullWidth: true },
  { name: 'position', label: 'Position', type: 'select', options: [
    { value: 'home_hero', label: 'Home Hero' }, { value: 'home_middle', label: 'Home Middle' }, { value: 'shop_top', label: 'Shop Top' },
  ] },
  { name: 'sortOrder', label: 'Sort order', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
];

const Banners = () => (
  <ResourceManager
    api={bannersApi}
    title="Banner"
    subtitle="banners"
    columns={columns}
    formFields={formFields}
    emptyForm={emptyForm}
    searchKeys={['title', 'position']}
    searchPlaceholder="Search banners..."
  />
);

export default Banners;

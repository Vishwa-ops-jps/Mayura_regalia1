import React from 'react';
import ResourceManager from '../components/ResourceManager';
import { categoriesApi } from '../services/adminApi';
import { onImageError } from '../utils';

const emptyForm = { name: '', description: '', image: '', status: 'active', sortOrder: 0 };

const CATEGORY_IMAGES = {
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

const categoryImage = (row) => row.image || CATEGORY_IMAGES[String(row.name || '').toLowerCase()] || '/products/regalia-5.jpg';

const columns = [
  { key: 'image', label: 'IMAGE', render: (row) => <img className="resource-image-thumb" src={categoryImage(row)} alt="" onError={onImageError} /> },
  { key: 'name', label: 'NAME' },
  { key: 'status', label: 'STATUS', render: (row) => <span className={`status-pill ${row.status}`}>{row.status}</span> },
  { key: 'sortOrder', label: 'ORDER' },
];

const formFields = [
  { name: 'name', label: 'Category name', required: true },
  { name: 'sortOrder', label: 'Sort order', type: 'number' },
  { name: 'image', label: 'Image path', placeholder: '/categories/necklaces.jpg' },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const Categories = () => (
  <ResourceManager
    api={categoriesApi}
    title="Category"
    subtitle="categories"
    columns={columns}
    formFields={formFields}
    emptyForm={emptyForm}
    searchKeys={['name']}
    searchPlaceholder="Search categories..."
  />
);

export default Categories;

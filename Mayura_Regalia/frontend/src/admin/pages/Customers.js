import React from 'react';
import ResourceManager from '../components/ResourceManager';
import { customersApi } from '../services/adminApi';
import { formatCurrency } from '../utils';

const emptyForm = { name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', status: 'active' };

const columns = [
  { key: 'name', label: 'NAME' },
  { key: 'email', label: 'EMAIL' },
  { key: 'phone', label: 'PHONE' },
  { key: 'totalOrders', label: 'ORDERS' },
  { key: 'totalSpent', label: 'SPENT', render: (row) => formatCurrency(row.totalSpent) },
  { key: 'status', label: 'STATUS', render: (row) => <span className={`status-pill ${row.status}`}>{row.status}</span> },
];

const formFields = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
  { name: 'address', label: 'Address', type: 'textarea', fullWidth: true },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }] },
];

const Customers = () => (
  <ResourceManager
    api={customersApi}
    title="Customer"
    subtitle="customers"
    columns={columns}
    formFields={formFields}
    emptyForm={emptyForm}
    searchKeys={['name', 'email', 'phone']}
    searchPlaceholder="Search customers..."
  />
);

export default Customers;

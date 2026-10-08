import React from 'react';
import ResourceManager from '../components/ResourceManager';
import { couponsApi } from '../services/adminApi';
import { formatDate } from '../utils';

const emptyForm = { code: '', type: 'percentage', value: '', minOrderAmount: 0, maxDiscount: '', usageLimit: '', status: 'active', expiresAt: '' };

const columns = [
  { key: 'code', label: 'CODE' },
  { key: 'type', label: 'TYPE' },
  { key: 'value', label: 'VALUE', render: (row) => (row.type === 'percentage' ? `${row.value}%` : `₹${row.value}`) },
  { key: 'usedCount', label: 'USED', render: (row) => `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ''}` },
  { key: 'expiresAt', label: 'EXPIRES', render: (row) => formatDate(row.expiresAt) },
  { key: 'status', label: 'STATUS', render: (row) => <span className={`status-pill ${row.status}`}>{row.status}</span> },
];

const formFields = [
  { name: 'code', label: 'Coupon code', required: true, placeholder: 'WELCOME10' },
  { name: 'type', label: 'Discount type', type: 'select', options: [{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed amount (₹)' }] },
  { name: 'value', label: 'Discount value', type: 'number', min: 0, required: true },
  { name: 'minOrderAmount', label: 'Minimum order amount (₹)', type: 'number', min: 0 },
  { name: 'maxDiscount', label: 'Max discount cap (₹, optional)', type: 'number', min: 0 },
  { name: 'usageLimit', label: 'Usage limit (optional)', type: 'number', min: 0 },
  { name: 'expiresAt', label: 'Expiry date', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
];

const buildPayload = (form) => ({ ...form, code: String(form.code || '').toUpperCase().trim() });

const Offers = () => (
  <ResourceManager
    api={couponsApi}
    title="Offer"
    subtitle="offers"
    columns={columns}
    formFields={formFields}
    emptyForm={emptyForm}
    searchKeys={['code']}
    searchPlaceholder="Search offer codes..."
    buildPayload={buildPayload}
  />
);

export default Offers;

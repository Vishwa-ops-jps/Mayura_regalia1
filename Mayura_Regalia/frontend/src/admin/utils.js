import React from 'react';

export function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const StatusPill = ({ value }) => (
  <span className={`status-pill ${String(value || '').toLowerCase()}`}>{value}</span>
);

// Neutral inline placeholder (no network request, never 404s) shown whenever a
// product/category/etc. image is missing or fails to load, instead of the
// browser's broken-image icon.
export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="10" fill="#F2ECE3"/>
      <path d="M22 54l12-14 9 10 7-8 8 12z" fill="#D9CBAF"/>
      <circle cx="30" cy="28" r="6" fill="#D9CBAF"/>
    </svg>`
  );

// Swap a broken/missing image to the placeholder above; onerror is cleared
// first so a placeholder that itself failed can't loop forever.
export function onImageError(e) {
  e.target.onerror = null;
  e.target.src = IMAGE_PLACEHOLDER;
}

import React from 'react';

const PATHS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-5 3 3 2-2 6 5" /></>,
  product: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  orders: <><path d="M6 3h12v18H6z" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
  customers: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  categories: <><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="7" r="2.5" /><circle cx="7" cy="17" r="2.5" /><circle cx="17" cy="17" r="2.5" /><path d="m9 7 6 0M7 9v6M17 9v6M9 17h6" /></>,
  collections: <><path d="M4 7h16M4 12h16M4 17h16" /><path d="M7 4v16M17 4v16" /></>,
  inventory: <><path d="M4 7h16v13H4zM8 7V4h8v3M4 12h16" /></>,
  returns: <><path d="M9 7H5l4-4M5 7a7 7 0 1 1 1 9" /></>,
  payments: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  gifts: <><rect x="3" y="9" width="18" height="11" rx="1" /><path d="M12 9v11M3 13h18M12 9H8a2.5 2.5 0 1 1 2.5-2.5C12 6.5 12 9 12 9ZM12 9h4a2.5 2.5 0 1 0-2.5-2.5C12 6.5 12 9 12 9Z" /></>,
  offers: <><path d="m4 5 15 0 2 7-2 7H4l-2-7 2-7Z" /><path d="m8 9 .01 0M16 15 .01 15" /></>,
  banners: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m5 16 4-4 3 3 2-2 5 4" /></>,
  reviews: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 9.6l6.2-.9L12 3Z" /></>,
  reports: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-5 3 2 5-6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L9 6.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.1 1Z" /></>,
  sales: <><path d="M4 7h16v13H4zM7 7V5a5 5 0 0 1 10 0v2" /><path d="M8 12h8" /></>,
  complete: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  cancel: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  warning: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v5M12 17v.1" /></>,
  rating: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9-5.6 2.9 1.1-6.1L3 9.6l6.2-.9L12 3Z" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  add: <><path d="M12 5v14M5 12h14" /></>,
  success: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
};

const AdminIcon = ({ name, size = 18, className = '' }) => (
  <svg className={`admin-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {PATHS[name] || PATHS.dashboard}
  </svg>
);

export default AdminIcon;

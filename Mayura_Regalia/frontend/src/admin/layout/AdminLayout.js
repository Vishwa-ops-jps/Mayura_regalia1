import React, { useEffect } from 'react';
import { NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import '../styles/AdminDashboard.css';
import AdminIcon from '../components/AdminIcon';

const MENU = [
  { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/hero', icon: 'image', label: 'Hero Section' },
  { to: '/admin/products', icon: 'product', label: 'Products' },
  { to: '/admin/categories', icon: 'categories', label: 'Categories' },
  { to: '/admin/collections', icon: 'collections', label: 'Collections' },
  { to: '/admin/inventory', icon: 'inventory', label: 'Inventory' },
  { to: '/admin/orders', icon: 'orders', label: 'Orders' },
  { to: '/admin/returns', icon: 'returns', label: 'Returns & Exchanges' },
  { to: '/admin/payments', icon: 'payments', label: 'Payments' },
  { to: '/admin/customers', icon: 'customers', label: 'Customers' },
  { to: '/admin/gifts', icon: 'gifts', label: 'Gifts' },
  { to: '/admin/offers', icon: 'offers', label: 'Offers / Coupons' },
  { to: '/admin/banners', icon: 'banners', label: 'Banners' },
  { to: '/admin/reviews', icon: 'reviews', label: 'Reviews' },
  { to: '/admin/reports', icon: 'reports', label: 'Reports' },
  { to: '/admin/settings', icon: 'settings', label: 'Settings' },
];

const TITLES = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/hero': 'Hero Section',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/collections': 'Collections',
  '/admin/inventory': 'Inventory',
  '/admin/orders': 'Orders',
  '/admin/returns': 'Returns & Exchanges',
  '/admin/payments': 'Payments',
  '/admin/customers': 'Customers',
  '/admin/gifts': 'Gifts',
  '/admin/offers': 'Offers & Coupons',
  '/admin/banners': 'Banners',
  '/admin/reviews': 'Reviews',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = authService.getAdmin();
  const title = TITLES[location.pathname] || 'Admin';

  useEffect(() => {
    document.title = `${title} · Mayura Regalia Admin`;
  }, [title]);

  useEffect(() => {
    let active = true;
    authService.verify().then((ok) => {
      if (active && !ok) authService.handleExpired();
    });
    return () => { active = false; };
  }, []);

  if (!authService.isAuthenticated()) return <Navigate to="/admin/login" replace />;

  const logout = () => {
    authService.logout();
    navigate('/admin/login', { replace: true });
  };

  const initial = (admin?.name || 'A').trim().charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-logo-frame">
            <img src="/LOGO_Mayura_Regalia.png" alt="Mayura Regalia" />
          </div>
          <span>ADMIN PANEL</span>
        </div>
        <nav>
          {MENU.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span><AdminIcon name={item.icon} /></span>{item.label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-logout" onClick={logout}><AdminIcon name="returns" size={16} /> Logout</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span className="admin-mobile-label"><img src="/LOGO_Mayura_Regalia.png" alt="" /> MAYURA REGALIA</span>
            <h1>{title}</h1>
          </div>
          <div className="admin-profile">
            <span className="admin-date-chip"><AdminIcon name="orders" size={14} /> {today}</span>
            <div className="avatar">{initial}</div>
            <div><strong>{admin?.name || 'Admin'}</strong><small>Administrator</small></div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

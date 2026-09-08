import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Earrings', path: '/earrings' },
    { name: 'Necklaces', path: '/necklaces' },
    { name: 'Bangles', path: '/bangles' },
    { name: 'Rings', path: '/rings' },
    { name: 'Bridal', path: '/bridal jewellery' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <Link to="/" className="logo">
            <img src="/LOGO_Mayura_Regalia.png" alt="Mayura Regalia" className="logo-img" />
          </Link>

          <nav className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.path}
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link to="/admin/login" className="admin-login-link">Admin</Link>
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>

            <Link to="/cart" className="cart-link">
              <span className="cart-icon">🛒</span>
              {getCartItemCount() > 0 && (
                <span className="cart-count">{getCartItemCount()}</span>
              )}
            </Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;

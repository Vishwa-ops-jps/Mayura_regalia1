import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import productService from '../services/productService';
import customerAuthService from '../services/customerAuthService';
import ChatBot from './ChatBot';
import '../styles/Header.css';
import '../styles/Wishlist.css';

const fashionJewellery = [
  ['BANGLES', '/shop?category=Bangles'],
  ['BRIDAL JEWELLERY', '/shop?category=Bridal+Jewellery'],
  ['NECKLACES', '/shop?category=Necklaces'],
  ['EARRINGS', '/shop?category=Earrings'],
  ['RINGS', '/shop?category=Rings'],
  ['BRACELETS', '/shop?category=Bracelets'],
];

const goldJewellery = [
  ['RINGS', '/shop?category=Gold+Rings'],
  ['BRACELETS', '/shop?category=Gold+Bracelets'],
  ['BANGLES', '/shop?category=Gold+Bangles'],
  ['SMALL CHAINS', '/shop?category=Gold+Chains'],
  ['PENDANTS', '/shop?category=Gold+Pendants'],
];

const silverJewellery = [
  ['SILVER', '/shop?category=Silver'],
  ['GERMAN SILVER', '/shop?category=German+Silver'],
];

const sarees = [
  'KANJEEVARAM',
  'MYSORE SILK',
  'KERALA KASAVU',
  'POCHAMPALLY IKAT',
  'CHETTINAD COTTON',
  'UPPADA SILK',
  'GADWAL',
  'KOORAI',
  'KONRAD',
];

const watches = [
  'MECHANICAL WATCHES',
  'AUTOMATIC WATCHES',
  'QUARTZ WATCHES',
  'ANALOG WATCHES',
  'LUXURY WATCHES',
];

const gifts = [
  'FESTIVE HAMPERS',
  'WEDDING HAMPERS',
  'JEWELLERY GIFT SETS',
  'CORPORATE HAMPERS',
  'PERSONALISED HAMPERS',
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const { wishlistCount } = useWishlist();
  // Re-evaluated on every render (Header re-renders on route change via
  // useLocation below), so this reflects the latest login/logout state.
  const loggedInCustomer = customerAuthService.isAuthenticated() ? customerAuthService.getCustomer() : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [bagMaterials, setBagMaterials] = useState([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const productsRef = useRef(null);
  const categoriesRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    productService.getCategories().then((data) => {
      const bagGroup = data?.groups?.find((group) => group.id === 'bags');
      if (mounted && Array.isArray(bagGroup?.materials)) setBagMaterials(bagGroup.materials);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productsRef.current && !productsRef.current.contains(event.target)) setProductsOpen(false);
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) setCategoriesOpen(false);
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProductsOpen(false);
    setCategoriesOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setProductsOpen(false);
    setCategoriesOpen(false);
    setAccountOpen(false);
  };

  const handleLogout = () => {
    customerAuthService.logout();
    closeMenus();
    navigate('/');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    closeMenus();
  };

  const scrollToSection = (sectionId) => {
    closeMenus();
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(`/#${sectionId}`);
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  const MegaMenu = ({ close }) => (
    <>
      <div className="mega-grid">
      <div className="mega-section">
        <Link className="mega-heading" to="/shop?category=Jewels" onClick={close}>JEWELLERY</Link>
        <Link to="/shop?category=Jewels&material=22+Carat" onClick={close}>22 CARAT</Link>
        <Link to="/shop?category=Jewels&material=18+Carat" onClick={close}>18 CARAT</Link>
        <span className="mega-label">SHOP GOLD BY TYPE</span>
        {goldJewellery.map(([label, path]) => <Link key={label} to={path} onClick={close}>{label}</Link>)}

        <Link className="mega-heading mega-heading-spaced" to="/shop?category=Silver+Jewellery" onClick={close}>SILVER JEWELLERY</Link>
        {silverJewellery.map(([label, path]) => <Link key={label} to={path} onClick={close}>{label}</Link>)}

        <Link className="mega-heading mega-heading-spaced" to="/shop?category=Fashion+Jewels" onClick={close}>FASHION JEWELLERY</Link>
        {fashionJewellery.map(([label, path]) => <Link key={label} to={path} onClick={close}>{label}</Link>)}
      </div>

      <div className="mega-section">
        <Link className="mega-heading" to="/shop?category=Sarees" onClick={close}>SAREES</Link>
        {sarees.map((name) => (
          <Link key={name} to={`/shop?category=Sarees&material=${encodeURIComponent(name)}`} onClick={close}>{name}</Link>
        ))}
      </div>

      <div className="mega-section">
        <Link className="mega-heading" to="/shop?category=Bags" onClick={close}>BAGS</Link>
        {bagMaterials.length > 0 && (
          <>
            <span className="mega-label">SHOP BY MATERIAL</span>
            {bagMaterials.map((material) => (
              <Link key={material} to={`/shop?category=Bags&material=${encodeURIComponent(material)}`} onClick={close}>{material.toUpperCase()}</Link>
            ))}
          </>
        )}

        <Link className="mega-heading mega-heading-spaced" to="/shop?category=Watches" onClick={close}>WATCHES</Link>
        {watches.map((name) => (
          <Link key={name} to={`/shop?category=Watches&material=${encodeURIComponent(name)}`} onClick={close}>{name}</Link>
        ))}
      </div>

      <div className="mega-section">
        <Link className="mega-heading" to="/shop?category=Gifts" onClick={close}>GIFTS</Link>
        {gifts.map((name) => (
          <Link key={name} to={`/shop?category=Gifts&material=${encodeURIComponent(name)}`} onClick={close}>{name}</Link>
        ))}
      </div>
    </div>
    </>
  );

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="logo" aria-label="Mayura Regalia Home" onClick={closeMenus}>
          <img src="/LOGO_Mayura_Regalia.png" alt="Mayura Regalia" className="logo-img" />
        </Link>

        <nav className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenus}>HOME</Link>
          <button type="button" className="nav-link nav-btn-link" onClick={() => scrollToSection('about-us')}>ABOUT US</button>

          <div
            className={`nav-item-dropdown ${productsOpen ? 'open' : ''}`}
            ref={productsRef}
          >
            <button type="button" className="nav-link nav-btn-link dropdown-toggle" onClick={() => { setProductsOpen((open) => !open); setCategoriesOpen(false); }} aria-expanded={productsOpen}>
              PRODUCTS <span className="dropdown-caret">▾</span>
            </button>
            <div className={`products-dropdown-menu ${productsOpen ? 'show' : ''}`}>
              <MegaMenu close={() => setProductsOpen(false)} />
            </div>
          </div>

          <div
            className={`nav-item-dropdown ${categoriesOpen ? 'open' : ''}`}
            ref={categoriesRef}
          >
            <button type="button" className="nav-link nav-btn-link dropdown-toggle" onClick={() => { setCategoriesOpen((open) => !open); setProductsOpen(false); }} aria-expanded={categoriesOpen}>
              CATEGORIES <span className="dropdown-caret">▾</span>
            </button>
            <div className={`products-dropdown-menu ${categoriesOpen ? 'show' : ''}`}>
              <MegaMenu close={() => setCategoriesOpen(false)} />
            </div>
          </div>

          <button type="button" className="nav-link nav-btn-link" onClick={() => scrollToSection('contact-us')}>CONTACT US</button>
          <Link to="/shop?category=Gifts" className="nav-link" onClick={closeMenus}>GIFTS</Link>
        </nav>

        <div className="header-actions">
          <form className="search-bar" onSubmit={handleSearch}>
            <input type="text" placeholder="SEARCH" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            <button type="submit" className="search-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </button>
          </form>

          {loggedInCustomer ? (
            <div className={`account-dropdown ${accountOpen ? 'open' : ''}`} ref={accountRef}>
              <button
                type="button"
                className="account-link with-name dropdown-toggle"
                aria-label={`My Account - ${loggedInCustomer.name}`}
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4.2" />
                </svg>
                <span className="account-name-label">Hi, {loggedInCustomer.name.split(' ')[0]}</span>
              </button>
              <div className={`account-dropdown-menu ${accountOpen ? 'show' : ''}`}>
                <Link to="/account" onClick={closeMenus}>My Account</Link>
                <button type="button" className="account-logout-link" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="account-link"
              aria-label="My Account"
              title="Login"
              onClick={closeMenus}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4.2" />
              </svg>
            </Link>
          )}

          <Link to="/wishlist" className="wishlist-link" aria-label="My Wishlist" title="Wishlist" onClick={closeMenus}>
            <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.3 5 6.4 5c1.9 0 3.3 1 4.1 2.3h3C14.3 6 15.7 5 17.6 5c3.1 0 4.9 3 3.7 6.3-1.8 4.6-9.3 9.2-9.3 9.2z" />
            </svg>
            {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
          </Link>

          <Link to="/cart" className="cart-link" aria-label="Shopping Cart">
            <span className="cart-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h2l1.4 8.2a2 2 0 0 0 2 1.7h6.8a2 2 0 0 0 1.9-1.5L20 8H7" />
                <circle cx="10" cy="19" r="1" />
                <circle cx="17" cy="19" r="1" />
              </svg>
            </span>
            {getCartItemCount() > 0 && <span className="cart-count">{getCartItemCount()}</span>}
          </Link>
        </div>

        {/* Instagram — ABOVE WhatsApp */}
        <a
          className="instagram-float"
          href="https://www.instagram.com/mayura.regalia/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow Mayura Regalia on Instagram"
          title="Instagram: @mayura.regalia"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>

        {/* WhatsApp — BELOW Instagram */}
        <a
          className="whatsapp-float"
          href="https://wa.me/918951084668"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Mayura Regalia on WhatsApp at 8951084668"
          title="WhatsApp: 8951084668"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.5 11.7a8.3 8.3 0 0 1-12.2 7.3L4 20l1.1-4.1a8.3 8.3 0 1 1 15.4-4.2Z" fill="none" stroke="currentColor" strokeWidth="1.7"/>
            <path d="M9 8.5c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.7c.6 1.1 1.5 1.9 2.7 2.5l.7-.5c.2-.1.4-.1.6 0l1.5.7c.3.1.4.3.3.6-.2.8-.8 1.4-1.5 1.5-2 .2-4.5-1.2-6-2.8-1.2-1.3-2.3-3.1-2-4.4.1-.4.4-.7.8-.9Z" fill="currentColor"/>
          </svg>
        </a>

        <ChatBot />

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Toggle Menu">☰</button>
      </div>
    </header>
  );
};

export default Header;

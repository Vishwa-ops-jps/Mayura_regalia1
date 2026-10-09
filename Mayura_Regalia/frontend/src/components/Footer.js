import React from 'react';
import { Link } from 'react-router-dom';
import storeInfo from '../data/storeInfo';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="contact-us">
      <div className="footer-container">
        <div className="footer-section">
          <Link to="/" className="footer-brand" aria-label="Mayura Regalia home"><img src="/LOGO_Mayura_Regalia.png" alt="Mayura Regalia" className="footer-logo" /></Link>
          <p>Jewellery that celebrates your elegance.</p>
        </div>

        <div className="footer-section">
          <h4>Shop</h4>
          <ul>
            <li>
              <Link to="/earrings">Earrings</Link>
            </li>
            <li>
              <Link to="/necklaces">Necklaces</Link>
            </li>
            <li>
              <Link to="/bangles">Bangles</Link>
            </li>
            <li>
              <Link to="/rings">Rings</Link>
            </li>
            <li>
              <Link to="/bridal jewellery">Bridal</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Customer Care</h4>
          <ul>
            <li>
              <a href={`tel:${storeInfo.phone}`}>Call us: {storeInfo.phone}</a>
            </li>
            <li>
              <Link to="/track-order">Track Your Order</Link>
            </li>
            {storeInfo.googleBusiness && (
              <li>
                <a href={storeInfo.googleBusiness} target="_blank" rel="noopener noreferrer">Find us on Google</a>
              </li>
            )}
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/shipping-policy">Shipping &amp; Delivery</Link>
            </li>
            <li>
              <Link to="/returns-policy">Returns &amp; Refunds</Link>
            </li>
            <li>
              <Link to="/#faq">FAQ</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-legal-links">
          <Link to="/privacy-policy">Privacy Policy</Link> · <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> · <Link to="/shipping-policy">Shipping</Link> · <Link to="/returns-policy">Returns</Link>
        </p>
        <p>&copy; 2026 MAYURA REGALIA. All Rights Reserved.{storeInfo.gstin ? ` GSTIN: ${storeInfo.gstin}` : ''}</p>
      </div>
    </footer>
  );
};

export default Footer;

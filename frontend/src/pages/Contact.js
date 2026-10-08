import React from 'react';
import { Link } from 'react-router-dom';
import storeInfo from '../data/storeInfo';
import usePageTitle from '../hooks/usePageTitle';
import '../styles/InfoPages.css';

const Contact = () => {
  usePageTitle('Contact Us', 'Get in touch with Mayura Regalia - call, WhatsApp or email us about orders, delivery and returns.');
  const s = storeInfo;
  return (
    <div className="info-page">
      <div className="info-container">
        <nav className="info-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>Contact Us</span></nav>
        <h1>Contact Us</h1>
        <p className="info-lead">Questions about an order, delivery, returns or a piece you love? We are happy to help.</p>

        <div className="contact-grid">
          <div className="contact-card"><h3>Call us</h3><a href={`tel:${s.phone}`}>{s.phone}</a><small>{s.hours}</small></div>
          {s.whatsapp && <div className="contact-card"><h3>WhatsApp</h3><a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer">Chat with us</a><small>Quickest way to reach us</small></div>}
          <div className="contact-card"><h3>Email</h3><a href={`mailto:${s.email}`}>{s.email}</a><small>We reply within 1-2 business days</small></div>
          {s.address && <div className="contact-card"><h3>Visit / Address</h3><span>{s.address}</span></div>}
          {s.googleBusiness && <div className="contact-card"><h3>Find us on Google</h3><a href={s.googleBusiness} target="_blank" rel="noopener noreferrer">View our Google Business Profile</a><small>Directions, hours and customer reviews</small></div>}
          {s.instagram && <div className="contact-card"><h3>Instagram</h3><a href={s.instagram} target="_blank" rel="noopener noreferrer">Follow us</a></div>}
        </div>

        <section className="info-section">
          <h2>Before you write</h2>
          <ul>
            <li>Include your order number so we can find your order quickly.</li>
            <li>For damaged or wrong items, attach photos or an unboxing video.</li>
            <li>See our <Link to="/shipping-policy">Shipping</Link> and <Link to="/returns-policy">Returns</Link> policies for common answers.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Contact;

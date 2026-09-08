import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ProductGrid from '../components/ProductGrid';
import CategoryCard from '../components/CategoryCard';
import productService from '../services/productService';
import useReveal from '../hooks/useReveal';
import '../styles/Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const categoryRef = useReveal();
  const featuredRef = useReveal();
  const bannerRef = useReveal();
  const whyRef = useReveal();

  useEffect(() => {
    productService.getAllProducts().then((products) => {
      setFeaturedProducts(products.slice(0, 8));
    });
  }, []);

  const categories = [
    {
      name: 'Earrings',
      image: '/products/regalia-2.jpg',
      link: '/earrings',
    },
    {
      name: 'Necklaces',
      image: '/products/regalia-1.jpg',
      link: '/necklaces',
    },
    {
      name: 'Bangles',
      image: '/products/regalia-3.jpg',
      link: '/bangles',
    },
    {
      name: 'Rings',
      image: '/products/regalia-4.jpg',
      link: '/rings',
    },
    {
      name: 'Bracelets',
      image: '/products/regalia-7.jpg',
      link: '/bracelets',
    },
    {
      name: 'Bridal Jewellery',
      image: '/products/regalia-5.jpg',
      link: '/bridal jewellery',
    },
  ];

  const features = [
    { icon: '✓', title: 'Premium Quality', description: 'Crafted with precision and care' },
    { icon: '✨', title: 'Elegant Designs', description: 'Timeless and contemporary styles' },
    { icon: '📦', title: 'Secure Packaging', description: 'Safe delivery guaranteed' },
    { icon: '🚚', title: 'Fast Shipping', description: 'Quick and reliable delivery' },
  ];

  return (
    <div className="home-page">
      <HeroSection />

      <section className="shop-by-category reveal-up" ref={categoryRef}>
        <h2>Shop By Category</h2>
        <div className="category-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
          ))}
        </div>
      </section>

      <section className="featured-products reveal-up" ref={featuredRef}>
        <h2>Featured Products</h2>
        <ProductGrid products={featuredProducts} />
      </section>

      <section className="promotional-banner reveal-up" ref={bannerRef}>
        <div className="banner-content">
          <span className="banner-eyebrow">Signature Collection</span>
          <h2>The Royal Collection</h2>
          <p>Discover timeless pieces inspired by Indian elegance.</p>
          <Link to="/shop" className="btn btn-primary">
            SHOP COLLECTION
          </Link>
        </div>
        <div className="banner-image">
          <img
            src="/products/regalia-5.jpg"
            alt="Royal Collection"
            onError={(e) => {
              e.target.src =
                '/products/regalia-5.jpg';
            }}
          />
        </div>
      </section>

      <section className="why-mayura reveal-up" ref={whyRef}>
        <h2>Why MAYURA REGALIA?</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

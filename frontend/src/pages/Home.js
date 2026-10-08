import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ProductGrid from '../components/ProductGrid';
import CategoryCard from '../components/CategoryCard';
import ReelCarousel from '../components/ReelCarousel';
import productService from '../services/productService';
import useReveal from '../hooks/useReveal';
import '../styles/Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [aboutSlide, setAboutSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  const categoryRef = useReveal();
  const featuredRef = useReveal();
  const bannerRef = useReveal();
  const whyRef = useReveal();
  const faqRef = useReveal();

  useEffect(() => {
    productService.getAllProducts().then((products) => {
      setFeaturedProducts(products.slice(0, 8));
    });
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 120);
      }
    }
  }, []);

  const reelSlides = [
    {
      video: '/videos/new-arrivals.mp4',
      eyebrow: 'JUST IN',
      title: 'New Arrivals',
      link: '/shop?sort=newest',
      chipImage: '/products/regalia-1.jpg',
      chipText: 'Royal Kundan Necklace',
    },
    {
      video: '/videos/trending.mp4',
      eyebrow: 'MAYURA FAVOURITES',
      title: 'Trending Now',
      link: '/shop?sort=featured',
      chipImage: '/products/regalia-5.jpg',
      chipText: 'Bridal Choker Necklace',
    },
    {
      video: '/videos/hero-slide.mp4',
      eyebrow: 'FASHION FIRST',
      title: 'Fashion Jewellery',
      link: '/shop?category=Fashion+Jewels',
      chipImage: '/products/regalia-2.jpg',
      chipText: 'Pearl Drop Earrings',
    },
    {
      video: '/videos/bridal-saree.mp4',
      eyebrow: 'BRIDAL COLLECTION',
      title: 'Bridal Sarees',
      link: '/shop?category=Sarees',
      chipText: 'Bridal Silk Saree',
    },
    {
      video: '/videos/bags.mp4',
      eyebrow: 'CARRY IT WELL',
      title: 'Bags',
      link: '/shop?category=Bags',
      chipText: 'Statement Bags',
    },
  ];

  const categories = [
    { name: 'GOLD JEWELLERY', icon: '✦', link: '/shop?category=Jewels' },
    { name: 'SILVER', icon: '◈', link: '/shop?category=Silver' },
    { name: 'GERMAN SILVER', icon: '✧', link: '/shop?category=German+Silver' },
    { name: 'FASHION JEWELLERY', video: '/videos/hero-slide.mp4', link: '/shop?category=Fashion+Jewels' },
    { name: 'SAREES', icon: '❖', link: '/shop?category=Sarees' },
    { name: 'BAGS', video: '/videos/bags.mp4', link: '/shop?category=Bags' },
    { name: 'WATCHES', icon: '◷', link: '/shop?category=Watches' },
    { name: 'GIFTS', icon: '♡', link: '/shop?category=Gifts' },
  ];

  const features = [
    { icon: '✓', title: 'Premium Quality', description: 'Crafted with precision and care' },
    { icon: '✦', title: 'Elegant Designs', description: 'Timeless and contemporary styles' },
    { icon: '◇', title: 'Curated Collections', description: 'Thoughtfully selected for every occasion' },
    { icon: '♡', title: 'Made For You', description: 'Pieces that celebrate your unique style' },
    { icon: '⌂', title: 'Personalised Service', description: 'A warm and attentive shopping experience' },
    { icon: '▢', title: 'Secure Packaging', description: 'Carefully packed for a beautiful arrival' },
    { icon: '→', title: 'Reliable Delivery', description: 'Quick and dependable delivery service' },
  ];

  const faqs = [
    {
      question: 'How do I know if a piece is genuine?',
      answer: 'Every Mayura Regalia piece is quality-checked and comes with details on material and craftsmanship on its product page, so you always know exactly what you\u2019re buying.',
    },
    {
      question: 'What are your delivery timelines?',
      answer: 'Most orders are dispatched within 1-2 business days and delivered within 4-7 business days, depending on your location.',
    },
    {
      question: 'Can I return or exchange a product?',
      answer: 'Yes, unused items in their original packaging can be returned or exchanged within 7 days of delivery. Visit the Returns page for the full policy.',
    },
    {
      question: 'Do you offer Cash on Delivery?',
      answer: 'Cash on Delivery is available on eligible pin codes, alongside all major cards, UPI and net banking at checkout.',
    },
    {
      question: 'How do I care for my jewellery?',
      answer: 'Store pieces in a dry, airtight pouch away from direct sunlight, and avoid contact with perfume, water and lotions to keep them looking their best.',
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq((current) => (current === index ? -1 : index));
  };

  const aboutSlides = Math.ceil(features.length / 3);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAboutSlide((current) => (current + 1) % aboutSlides);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [aboutSlides]);

  const showAboutSlide = (direction) => {
    setAboutSlide((current) => (current + direction + aboutSlides) % aboutSlides);
  };

  return (
    <div className="home-page">
      <HeroSection />

      <section className="shop-by-category reveal-up" ref={categoryRef} id="categories">
        <div className="section-title-wrap">
          <h2>Mayura Regalia Collections</h2>
          <p className="section-subtitle">Explore our newly launched collection</p>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.name} {...cat} />
          ))}
        </div>
      </section>

      <section className="collection-highlights" aria-label="Shop highlights">
        <ReelCarousel slides={reelSlides} />
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
          <img src="/products/JewelsSet.jpeg" alt="Royal Collection - layered gold jewellery set" className="banner-img-single" />
        </div>
      </section>

      <section className="why-mayura reveal-up" ref={whyRef} id="about-us">
        <div className="about-intro">
          <span className="section-eyebrow">THE MAYURA EXPERIENCE</span>
          <h2>Why MAYURA REGALIA?</h2>
          <p>Discover thoughtful details, elegant designs and a shopping experience created around you.</p>
        </div>
        <div className="features-carousel">
          <button type="button" className="about-carousel-btn" onClick={() => showAboutSlide(-1)} aria-label="Previous about cards">‹</button>
          <div className="features-viewport">
            <div className="features-track" style={{ transform: `translateX(-${aboutSlide * 100}%)` }}>
              {Array.from({ length: aboutSlides }, (_, slideIndex) => (
                <div className="features-slide" key={slideIndex}>
                  {features.slice(slideIndex * 3, slideIndex * 3 + 3).map((feature, i) => (
                    <div key={feature.title} className="feature-card">
                      <span className="feature-index">{String(slideIndex * 3 + i + 1).padStart(2, '0')}</span>
                      <div className="feature-icon">{feature.icon}</div>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button type="button" className="about-carousel-btn" onClick={() => showAboutSlide(1)} aria-label="Next about cards">›</button>
        </div>
        <div className="about-carousel-dots">
          {Array.from({ length: aboutSlides }, (_, index) => (
            <button type="button" key={index} className={index === aboutSlide ? 'active' : ''} onClick={() => setAboutSlide(index)} aria-label={`Show about slide ${index + 1}`} />
          ))}
        </div>
      </section>

      <section className="faq-section reveal-up" ref={faqRef} id="faq">
        <div className="about-intro">
          <span className="section-eyebrow">GOOD TO KNOW</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know before you shop with us.</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={faq.question}>
              <button
                type="button"
                className="faq-question"
                onClick={() => toggleFaq(index)}
                aria-expanded={openFaq === index}
              >
                <span>{faq.question}</span>
                <span className="faq-toggle-icon" aria-hidden="true">{openFaq === index ? '−' : '+'}</span>
              </button>
              <div className="faq-answer" style={{ maxHeight: openFaq === index ? '220px' : '0px' }}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

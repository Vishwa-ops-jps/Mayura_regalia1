import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import '../styles/HeroSection.css';

// Shown until the slides load from the server (and if the server is unreachable).
// The live slides are managed in Admin > Settings > Hero Section.
const FALLBACK_SLIDES = [
  {
    "id": "bridal",
    "badge": "BRIDAL COLLECTION",
    "tagline": "For your most precious moments",
    "collectionName": "BRIDAL JEWELLERY",
    "description": "Exquisite handcrafted bridal jewellery sets for your special day",
    "buttonText": "EXPLORE NOW",
    "link": "/shop?category=Bridal+Jewellery",
    "images": [
      "/CoverImage1.png",
      "/products/regalia-5.jpg",
      "/products/regalia-11.jpg",
      "/products/fashion-jewels-1.jpg"
    ]
  },
  {
    "id": "kundan",
    "badge": "KUNDAN & TEMPLE",
    "tagline": "Timeless beauty crafted for generations",
    "collectionName": "JEWELLERY COLLECTIONS",
    "description": "Intricately handcrafted gold, kundan and precious gemstone jewellery",
    "buttonText": "EXPLORE NOW",
    "link": "/shop",
    "images": [
      "/CoverImage2.jpg",
      "/products/regalia-1.jpg",
      "/products/regalia-9.jpg",
      "/products/fashion-jewels-2.jpg"
    ]
  },
  {
    "id": "sarees",
    "badge": "SAREES",
    "tagline": "Woven poetry for celebratory grace",
    "collectionName": "SAREES COLLECTION",
    "description": "Traditional Kalamkari prints and rich velvet sarees",
    "buttonText": "EXPLORE NOW",
    "link": "/shop?category=Sarees",
    "images": [
      "/BlueSaree.jpeg",
      "/products/saree-wine-velvet.jpg",
      "/products/saree-cotton-elephant-print.jpg"
      ]
  }
];

const BRAND_NAME = 'MAYURA REGALIA';

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);

  useEffect(() => {
    let active = true;
    apiRequest('/settings/hero')
      .then((data) => {
        if (active && Array.isArray(data.slides) && data.slides.length) {
          setSlides(data.slides);
          setCurrent(0);
        }
      })
      .catch(() => { /* keep the fallback slides */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isPaused) return undefined;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <section
      className="hero-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Featured Collections Banner"
    >
      <div className="hero-slider-wrap">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={`hero-banner-card ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
            >
              {/* 2x2 Image Grid Collage */}
              <div className={`hero-collage-grid collage-count-${Math.min((slide.images || []).length, 4) || 1}`}>
                <span className="hero-corner-badge">{slide.badge}</span>
                {(slide.images || []).slice(0, 4).map((src, imgIndex) => (
                  <div key={imgIndex} className={`collage-cell collage-cell-${imgIndex + 1}`}>
                    <img
                      src={src}
                      alt={`${slide.collectionName} ${imgIndex + 1}`}
                      className="collage-img"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
              </div>

              {/* Brand Card */}
              <div className="hero-parchment-content">
                <span className="hero-tagline">{slide.tagline}</span>

                <div className="hero-brand-block">
                  <img
                    src="/LOGO_Mayura_Regalia.png"
                    alt="Mayura Regalia"
                    className="hero-brand-logo"
                  />
                  <h2 className="hero-brand-title">{BRAND_NAME}</h2>
                  <div className="hero-signature-kicker">{slide.collectionName}</div>
                </div>

                <p className="hero-collection-desc">{slide.description}</p>

                <Link to={slide.link} className="hero-explore-btn">
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Carousel indicators */}
      <div className="hero-diamond-dots" role="tablist" aria-label="Hero slide navigation">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`diamond-dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}: ${slide.collectionName}`}
            role="tab"
            aria-selected={index === current}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;

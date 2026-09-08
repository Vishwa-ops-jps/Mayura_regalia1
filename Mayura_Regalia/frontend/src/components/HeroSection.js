import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/HeroSection.css';

const slides = [
  {
    image: '/CoverImage1.png',
    eyebrow: 'The Mayura Regalia Edit',
    title: <>Timeless Beauty.<br />Crafted for Generations.</>,
    subtitle: 'Exquisite jewellery for every moment of your life.',
  },
  {
    image: '/CoverImage2.jpg',
    eyebrow: 'Handcrafted Elegance',
    title: <>Radiance That<br />Speaks for Itself.</>,
    subtitle: 'Handcrafted pieces designed to celebrate you.',
  },
];

const HeroSection = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-image">

        {slides.map((slide, index) => (
          <img
            key={slide.image}
            src={slide.image}
            alt={`Mayura Regalia Collection ${index + 1}`}
            className={`slide-image ${
              index === currentImage ? 'active' : ''
            }`}
          />
        ))}

        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`hero-overlay ${index === currentImage ? 'active' : ''}`}
          >
            <span className="hero-eyebrow">{slide.eyebrow}</span>

            <h1 className="hero-title">{slide.title}</h1>

            <p className="hero-subtitle">{slide.subtitle}</p>

            <Link to="/shop" className="hero-button">
              EXPLORE COLLECTION
            </Link>
          </div>
        ))}

        {/* Slideshow indicators */}
        <div className="slide-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={index === currentImage ? 'active' : ''}
              onClick={() => setCurrentImage(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
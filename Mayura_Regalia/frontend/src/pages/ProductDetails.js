import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import QuantitySelector from '../components/QuantitySelector';
import ProductReviews from '../components/ProductReviews';
import ProductInfoSections from '../components/ProductInfoSections';
import WishlistButton from '../components/WishlistButton';
import productService from '../services/productService';
import '../styles/ProductDetails.css';

/* ── Lightbox ────────────────────────────────────────────── */
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image zoom view"
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Close zoom">✕</button>

      {images.length > 1 && (
        <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous">‹</button>
      )}

      <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[idx]}
          alt={`View ${idx + 1} of ${images.length}`}
          className="lightbox-img"
          draggable={false}
        />
        {images.length > 1 && (
          <span className="lightbox-counter">{idx + 1} / {images.length}</span>
        )}
      </div>

      {images.length > 1 && (
        <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next">›</button>
      )}
    </div>
  );
};

/* ── ProductDetails ──────────────────────────────────────── */
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    productService
      .getProductById(id)
      .then((prod) => {
        setProduct(prod);
        setSelectedImageIndex(0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const images = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length) return product.images.filter(Boolean);
    if (typeof product.images === 'string') {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
      } catch {}
    }
    return product.image ? [product.image] : [];
  }, [product]);

  const activeImage = images[selectedImageIndex] || product?.image;

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({ ...product, quantity });
    navigate('/checkout');
  };

  if (loading) {
    return <div className="product-details-page loading">Loading...</div>;
  }

  if (error || !product) {
    return (
      <div className="product-details-page error">
        <h2>Product not found</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      {showNotification && (
        <div className="notification">Added to cart!</div>
      )}

      {/* Lightbox zoom overlay */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          startIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="product-details-container">
        <div className="product-gallery-wrapper">
          <div className="product-image-section">
            {/* Main product image — click to open lightbox */}
            <button
              type="button"
              className="product-image-zoom-btn"
              onClick={() => setLightboxOpen(true)}
              aria-label="Click to zoom image"
              title="Click to zoom"
            >
              <img
                src={activeImage}
                alt={product.name}
                className="product-image-large"
              />
              <span className="zoom-hint-badge" aria-hidden="true">🔍 Zoom</span>
            </button>

            {product.discount > 0 && (
              <div className="discount-badge-large">{product.discount}% OFF</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav-btn prev"
                  onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="gallery-nav-btn next"
                  onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  aria-label="Next image"
                >
                  ›
                </button>
                <div className="gallery-counter-badge">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip — only shown when multiple images actually exist */}
          {images.length > 1 && (
            <div className="product-thumbnails-strip">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`product-thumb-btn ${idx === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  onMouseEnter={() => setSelectedImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details-section">
          <h1 className="product-name">{product.name}</h1>

          {Number(product.rating) > 0 && (
            <div className="product-rating">
              {'★'.repeat(Math.floor(product.rating))}
              <span className="rating-value">({product.rating})</span>
            </div>
          )}

          <div className="product-pricing-details">
            <span className="price-large">₹{product.price}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="original-price-large">₹{product.originalPrice}</span>
            )}
            {product.discount > 0 && (
              <span className="discount-large">{product.discount}% OFF</span>
            )}
          </div>

          <div className="product-meta">
            <div className="meta-row">
              <span className="meta-label">Material:</span>
              <span className="meta-value">{product.material}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Color:</span>
              <span className="meta-value">{product.color}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Availability:</span>
              <span className={`meta-value ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <ProductInfoSections product={product} />

          <div className="product-actions">
            <div className="quantity-section">
              <label>Quantity:</label>
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
                disabled={!product.inStock}
              />
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                {product.inStock ? 'Buy Now' : 'Out of Stock'}
              </button>
            </div>
            <WishlistButton productId={product.id} variant="full" />
            {!product.inStock && (
              <p className="out-of-stock-note">
                This item is currently out of stock and can&apos;t be purchased right now.
              </p>
            )}
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} productName={product.name} />
    </div>
  );
};

export default ProductDetails;

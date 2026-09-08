import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [showNotification, setShowNotification] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  return (
    <div className="product-card">
      {showNotification && (
        <div className="notification">Added to cart!</div>
      )}

      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image-container">
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              e.target.src =
                'https://via.placeholder.com/300x300?text=Jewellery';
            }}
          />
          {product.discount > 0 && (
            <div className="discount-badge">{product.discount}% OFF</div>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-category">{product.category}</p>

          <div className="product-rating">
            {'★'.repeat(Math.floor(product.rating))}
            <span className="rating-value">({product.rating})</span>
          </div>

          <div className="product-pricing">
            <span className="price">₹{product.price}</span>
            <span className="original-price">₹{product.originalPrice}</span>
          </div>
        </div>
      </Link>

      <button
        className="add-to-cart-btn"
        onClick={handleAddToCart}
        disabled={!product.inStock}
      >
        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
};

export default ProductCard;

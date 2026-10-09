import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import WishlistButton from './WishlistButton';
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

      <WishlistButton productId={product.id} />

      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image-container">
          <img
            src={product.image}
            alt={product.name}
            className={`product-image ${Array.isArray(product.images) && product.images[1] ? 'has-hover' : ''}`}
            onError={(e) => {
              e.target.src =
                'https://via.placeholder.com/300x300?text=Jewellery';
            }}
          />
          {Array.isArray(product.images) && product.images[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              className="product-image-hover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          {product.discount > 0 && (
            <div className="discount-badge">{product.discount}% OFF</div>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-category">{product.category}</p>

          {Number(product.rating) > 0 && (
            <div className="product-rating">
              {'★'.repeat(Math.floor(product.rating))}
              <span className="rating-value">({product.rating})</span>
            </div>
          )}

          <div className="product-pricing">
            <span className="price">₹{product.price}</span>
            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
              <span className="original-price">₹{product.originalPrice}</span>
            )}
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

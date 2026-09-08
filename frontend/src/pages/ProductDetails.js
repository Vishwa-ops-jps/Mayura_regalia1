import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import QuantitySelector from '../components/QuantitySelector';
import productService from '../services/productService';
import '../styles/ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    productService
      .getProductById(id)
      .then((prod) => {
        setProduct(prod);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

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

      <div className="product-details-container">
        <div className="product-image-section">
          <img
            src={product.image}
            alt={product.name}
            className="product-image-large"
            onError={(e) => {
              e.target.src =
                'https://via.placeholder.com/400x400?text=Jewellery';
            }}
          />
          {product.discount > 0 && (
            <div className="discount-badge-large">{product.discount}% OFF</div>
          )}
        </div>

        <div className="product-details-section">
          <h1 className="product-name">{product.name}</h1>

          <div className="product-rating">
            {'★'.repeat(Math.floor(product.rating))}
            <span className="rating-value">({product.rating})</span>
          </div>

          <div className="product-pricing-details">
            <span className="price-large">₹{product.price}</span>
            <span className="original-price-large">₹{product.originalPrice}</span>
            <span className="discount-large">{product.discount}% OFF</span>
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

          <div className="product-actions">
            <div className="quantity-section">
              <label>Quantity:</label>
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
              />
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                Add to Cart
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

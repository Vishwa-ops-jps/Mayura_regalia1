import React from 'react';
import '../styles/QuantitySelector.css';

const QuantitySelector = ({ quantity, onQuantityChange, maxStock = 10 }) => {
  return (
    <div className="quantity-selector">
      <button
        className="qty-btn"
        onClick={() => quantity > 1 && onQuantityChange(quantity - 1)}
        disabled={quantity <= 1}
      >
        −
      </button>
      <input
        type="number"
        className="qty-input"
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (val > 0 && val <= maxStock) {
            onQuantityChange(val);
          }
        }}
        min="1"
        max={maxStock}
      />
      <button
        className="qty-btn"
        onClick={() => quantity < maxStock && onQuantityChange(quantity + 1)}
        disabled={quantity >= maxStock}
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;

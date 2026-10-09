import React from 'react';
import '../styles/QuantitySelector.css';

const QuantitySelector = ({ quantity, onQuantityChange, maxStock = 10, disabled = false }) => {
  return (
    <div className="quantity-selector">
      <button
        className="qty-btn"
        onClick={() => quantity > 1 && onQuantityChange(quantity - 1)}
        disabled={disabled || quantity <= 1}
      >
        −
      </button>
      <input
        type="number"
        className="qty-input"
        value={quantity}
        disabled={disabled}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
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
        disabled={disabled || quantity >= maxStock}
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;

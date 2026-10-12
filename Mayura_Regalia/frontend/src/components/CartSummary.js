import React from 'react';
import '../styles/CartSummary.css';

const CartSummary = ({ subtotal, discount = 0, shipping = 0, variant = 'cart' }) => {
  const total = subtotal + shipping - discount;
  const isCheckout = variant === 'checkout';

  return (
    <div className="cart-summary">
      <div className="summary-row">
        <span>{isCheckout ? 'Item Total (incl. of taxes):' : 'Subtotal:'}</span>
        <span>₹{subtotal}</span>
      </div>
      {shipping > 0 && (
        <div className="summary-row">
          <span>Shipping:</span>
          <span>₹{shipping}</span>
        </div>
      )}
      {shipping === 0 && (
        <div className="summary-row free-shipping">
          <span>Shipping:</span>
          <span>FREE</span>
        </div>
      )}
      {isCheckout && (
        <div className="summary-row">
          <span>GST:</span>
          <span>Included</span>
        </div>
      )}
      {discount > 0 && (
        <div className="summary-row discount">
          <span>Discount:</span>
          <span>-₹{discount}</span>
        </div>
      )}
      <div className="summary-divider"></div>
      <div className="summary-row total">
        <span>{isCheckout ? 'Total Payable:' : 'Total:'}</span>
        <span>₹{total}</span>
      </div>
    </div>
  );
};

export default CartSummary;

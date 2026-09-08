import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';
import '../styles/Cart.css';

const Cart = () => {
  const { cart, clearCart, getCartTotal } = useCart();
  const subtotal = getCartTotal();
  const shipping = subtotal > 999 ? 0 : 100;
  const discount = 0;

  if (cart.length === 0) {
    return (
      <div className="cart-page empty-cart">
        <div className="empty-cart-content">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>Start shopping to add items to your cart.</p>
          <Link to="/shop" className="btn btn-primary">
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-items-section">
          <div className="cart-items">
            <div className="cart-items-heading">
              <h1>Shopping Cart</h1>
              <span>Price</span>
            </div>
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
            <div className="cart-subtotal">
              Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'}): <strong>&#8377;{subtotal}</strong>
            </div>
          </div>

          <div className="cart-actions">
            <Link to="/shop" className="btn btn-secondary">
              CONTINUE SHOPPING
            </Link>
            <button className="btn btn-danger" onClick={clearCart}>
              CLEAR CART
            </button>
          </div>
        </div>

        <aside className="cart-summary-section">
          <div className="summary-card">
            <div className="delivery-note">
              <span className="delivery-check">&#10003;</span>
              <span>Your order is eligible for <strong>FREE Delivery.</strong></span>
            </div>
            <h2>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'}): <strong>&#8377;{subtotal}</strong></h2>
            <CartSummary subtotal={subtotal} shipping={shipping} discount={discount} />
            <Link to="/checkout" className="btn btn-primary btn-full checkout-button">
              <span>Proceed to Buy</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;

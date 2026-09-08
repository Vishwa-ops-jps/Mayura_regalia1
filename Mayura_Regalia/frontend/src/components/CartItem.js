import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import QuantitySelector from './QuantitySelector';
import '../styles/CartItem.css';

const CartItem = ({ item }) => {
  const { removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

  const updateQuantity = (quantity) => {
    if (quantity > item.quantity) increaseQuantity(item.id);
    else decreaseQuantity(item.id);
  };

  return (
    <article className="cart-item">
      <Link to={`/product/${item.id}`} className="cart-item-image">
        <img
          src={item.image}
          alt={item.name}
          onError={(event) => { event.target.src = 'https://via.placeholder.com/100x100?text=Jewellery'; }}
        />
      </Link>
      <div className="cart-item-details">
        <Link to={`/product/${item.id}`} className="cart-item-name">{item.name}</Link>
        <p className="cart-item-category">{item.category}</p>
        <p className="cart-item-availability">In stock</p>
        <div className="cart-item-controls">
          <QuantitySelector quantity={item.quantity} onQuantityChange={updateQuantity} />
          <button className="cart-item-text-action" onClick={() => removeFromCart(item.id)}>Delete</button>
        </div>
      </div>
      <div className="cart-item-total">&#8377;{item.price * item.quantity}</div>
    </article>
  );
};

export default CartItem;

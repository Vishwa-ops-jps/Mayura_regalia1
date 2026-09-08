import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartSummary from '../components/CartSummary';
import QuantitySelector from '../components/QuantitySelector';
import orderService from '../services/orderService';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [savedForLater, setSavedForLater] = useState([]);
  // Keeps the checkout as a normal page so navigation and scrolling remain stable.
  const [orderPlaced, setOrderPlaced] = useState(false);

  const closeDrawer = (destination) => navigate(destination);

  const subtotal = getCartTotal();
  const shipping = subtotal > 999 ? 0 : 100;
  const discount = couponApplied ? Math.min(100, subtotal) : 0;
  const total = subtotal + shipping - discount;

  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const applyCoupon = () => {
    if (couponInput.trim().toUpperCase() === 'SAVE100') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponApplied(false);
      setCouponError('Invalid or expired code');
    }
  };

  const saveForLater = (item) => {
    setSavedForLater((prev) => [...prev, item]);
    removeFromCart(item.id);
  };

  const moveBackToBag = (item) => {
    setSavedForLater((prev) => prev.filter((i) => i.id !== item.id));
    addToCart(item);
  };

  if (cart.length === 0 && savedForLater.length === 0 && !orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <span className="checkout-kicker">MAYURA REGALIA</span>
          <h1>Your bag is empty</h1>
          <p>Add a piece you love and return here when you're ready to complete your order.</p>
          <button onClick={() => navigate('/shop')} className="btn btn-primary">
            BACK TO SHOP
          </button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = 'Valid email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) return;
    if (!validateForm()) return;

    setLoading(true);

    try {
      const orderData = {
        customer: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
        },
        deliveryAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: cart,
        paymentMethod: formData.paymentMethod,
        couponCode: couponApplied ? 'SAVE100' : null,
        giftMessage: giftEnabled ? giftMessage : null,
        subtotal,
        shipping,
        discount,
        total,
      };

      const order = await orderService.placeOrder(orderData);
      // Mark the order as placed *before* clearing the cart so the
      // empty-cart view doesn't flash while the drawer slides closed.
      setOrderPlaced(true);
      clearCart();
      closeDrawer(`/order-success?orderId=${order.id}`);
    } catch (error) {
      setErrors({ submit: 'Failed to place order. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-progress" aria-label="Checkout progress">
          <button type="button" onClick={() => closeDrawer('/cart')}>
            Cart
          </button>
          <span aria-hidden="true">›</span>
          <strong>Checkout</strong>
          <span className="checkout-help">
            Need help? <a href="tel:8951084668">8951084668</a>
          </span>
        </div>
      </div>

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Customer Information</h2>

            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && (
                <span className="error-message">{errors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile Number *</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className={errors.mobile ? 'error' : ''}
              />
              {errors.mobile && (
                <span className="error-message">{errors.mobile}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>Delivery Address</h2>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className={errors.address ? 'error' : ''}
              />
              {errors.address && (
                <span className="error-message">{errors.address}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && (
                  <span className="error-message">{errors.city}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={errors.state ? 'error' : ''}
                />
                {errors.state && (
                  <span className="error-message">{errors.state}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={errors.pincode ? 'error' : ''}
                />
                {errors.pincode && (
                  <span className="error-message">{errors.pincode}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Payment Method</h2>

            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                />
                <span>Cash on Delivery</span>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={formData.paymentMethod === 'online'}
                  onChange={handleInputChange}
                />
                <span>Demo Online Payment</span>
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || cart.length === 0}
          >
            {loading ? 'PROCESSING...' : cart.length === 0 ? 'YOUR BAG IS EMPTY' : 'PLACE ORDER'}
          </button>
        </form>

        <div className="checkout-summary">
          <div className="summary-card bag-card">
            <h2>Your Bag ({cart.length})</h2>

            {shipping === 0 ? (
              <div className="shipping-banner unlocked">
                <span>🚚 Free shipping unlocked for this order</span>
                <div className="shipping-bar"><div style={{ width: '100%' }}></div></div>
              </div>
            ) : (
              <div className="shipping-banner">
                <span>Add ₹{999 - subtotal} more for FREE shipping</span>
                <div className="shipping-bar"><div style={{ width: `${Math.min(100, Math.round((subtotal / 999) * 100))}%` }}></div></div>
              </div>
            )}

            <div className="bag-items">
              {cart.map((item) => (
                <div className="bag-item" key={item.id}>
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/72x72?text=Jewellery'; }}
                  />
                  <div className="bag-item-info">
                    <div className="bag-item-top">
                      <p className="bag-item-name">{item.name}</p>
                      <button type="button" className="bag-item-remove" onClick={() => removeFromCart(item.id)} aria-label="Remove item">✕</button>
                    </div>
                    <p className="bag-item-meta">{item.category}</p>
                    <p className="bag-item-price">₹{item.price * item.quantity}</p>
                    <p className="bag-item-delivery">✅ Delivery by {estimatedDelivery}</p>
                    <div className="bag-item-actions">
                      <QuantitySelector
                        quantity={item.quantity}
                        onQuantityChange={(qty) => (qty > item.quantity ? increaseQuantity(item.id) : decreaseQuantity(item.id))}
                      />
                      <button type="button" className="save-later-btn" onClick={() => saveForLater(item)}>Save for later</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {savedForLater.length > 0 && (
              <div className="saved-for-later">
                <h3>Saved for later ({savedForLater.length})</h3>
                {savedForLater.map((item) => (
                  <div className="bag-item" key={item.id}>
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/72x72?text=Jewellery'; }}
                    />
                    <div className="bag-item-info">
                      <p className="bag-item-name">{item.name}</p>
                      <p className="bag-item-price">₹{item.price}</p>
                      <button type="button" className="save-later-btn" onClick={() => moveBackToBag(item)}>Move back to bag</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="coupon-box">
              <span className="coupon-icon">🏷️</span>
              <input
                type="text"
                placeholder="Enter coupon code (try SAVE100)"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
              />
              <button type="button" onClick={applyCoupon}>Apply</button>
            </div>
            {couponApplied && <p className="coupon-success">🎉 ₹100 off unlocked with SAVE100</p>}
            {couponError && <p className="coupon-error">{couponError}</p>}

            <label className="gift-toggle">
              <input type="checkbox" checked={giftEnabled} onChange={(e) => setGiftEnabled(e.target.checked)} />
              <div>
                <strong>Buying this to Gift Someone?</strong>
                <span>Send a personalized message with this order</span>
              </div>
              <span className="gift-chevron">›</span>
            </label>
            {giftEnabled && (
              <textarea
                className="gift-message"
                placeholder="Write your gift message..."
                rows="3"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
              />
            )}
          </div>

          <div className="summary-card order-summary-card">
            <h2>Order Summary</h2>
            <CartSummary subtotal={subtotal} shipping={shipping} discount={discount} variant="checkout" />
            <p className="payment-accepted">UPI, Cards, Cash on Delivery accepted · Secure checkout</p>
          </div>

          <div className="trust-badges">
            <div><span>🛡️</span>Secure Checkout</div>
            <div><span>↩️</span>15 Days Free Return</div>
            <div><span>🏆</span>Trusted Craftsmanship</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

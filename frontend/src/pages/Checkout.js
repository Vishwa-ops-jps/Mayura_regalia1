import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartSummary from '../components/CartSummary';
import QuantitySelector from '../components/QuantitySelector';
import orderService from '../services/orderService';
import paymentService, { buildUpiLink } from '../services/paymentService';
import customerAuthService from '../services/customerAuthService';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  // Pre-fill form with the logged-in customer's saved address if available.
  const savedCustomer = customerAuthService.getCustomer();
  const [formData, setFormData] = useState({
    fullName: savedCustomer?.name || '',
    mobile: savedCustomer?.phone || '',
    email: savedCustomer?.email || '',
    address: savedCustomer?.address || '',
    city: savedCustomer?.city || '',
    state: savedCustomer?.state || '',
    pincode: savedCustomer?.pincode || '',
    paymentMethod: 'cod',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCouponData, setAppliedCouponData] = useState(null); // { code, discount }
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [savedForLater, setSavedForLater] = useState([]);
  // Keeps the checkout as a normal page so navigation and scrolling remain stable.
  const [orderPlaced, setOrderPlaced] = useState(false);
  // Which payment methods the admin currently has switched on (Settings >
  // Payment Gateway). Defaults to COD-only until this resolves, so the
  // "Pay Online" option never flashes on for a store that hasn't set up
  // Razorpay yet.
  const [paymentConfig, setPaymentConfig] = useState({ codEnabled: true, razorpayEnabled: false, directUpiEnabled: false, upiId: '', storeName: 'Mayura Regalia' });
  // Holds the placed order + UPI link while we're waiting on the customer
  // to pay directly and report back their UTR - null the rest of the time.
  const [directUpiOrder, setDirectUpiOrder] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [utrError, setUtrError] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  // Optional payment-screenshot the customer can attach as extra proof,
  // kept as a base64 data URL ready to send straight to the backend.
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofError, setProofError] = useState('');

  useEffect(() => {
    paymentService.getConfig()
      .then((config) => {
        setPaymentConfig(config);
        // If COD has been switched off in the admin and online is the only
        // option, don't leave the form defaulted to an option that can't
        // be submitted.
        if (!config.codEnabled && config.razorpayEnabled) {
          setFormData((prev) => ({ ...prev, paymentMethod: 'online' }));
        }
      })
      .catch(() => setPaymentConfig({ codEnabled: true, razorpayEnabled: false, directUpiEnabled: false, upiId: '', storeName: 'Mayura Regalia' }));
  }, []);

  const closeDrawer = (destination) => navigate(destination);

  const subtotal = getCartTotal();
  const shipping = subtotal > 999 ? 0 : 100;
  const discount = couponApplied && appliedCouponData ? appliedCouponData.discount : 0;
  const total = subtotal + shipping - discount;

  const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) { setCouponError('Please enter a coupon code.'); return; }
    // Reset any previously applied coupon so the total doesn't use a stale discount.
    setCouponApplied(false);
    setAppliedCouponData(null);
    setCouponError('');
    setCouponLoading(true);
    try {
      const { apiRequest } = await import('../services/api');
      const result = await apiRequest('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      });
      setAppliedCouponData(result); // { code, discount, type, value }
      setCouponApplied(true);
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
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
          <h1>Your cart is empty</h1>
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

  // Mark the order as placed *before* clearing the cart so the empty-cart
  // view doesn't flash while the drawer slides closed.
  const finalizeOrder = (order) => {
    setOrderPlaced(true);
    clearCart();
    closeDrawer(`/order-success?orderId=${order.id}`);
  };

  // Opens the Razorpay Checkout widget for an order that's already been
  // saved (as pending) on the backend. The widget itself offers cards, UPI,
  // netbanking and wallets - which ones show up is controlled from the
  // admin's own Razorpay dashboard, not from this code.
  const payOnline = async (order) => {
    if (!order.dbOrderId) {
      setErrors({ submit: 'Could not start online payment. Please choose Cash on Delivery instead.' });
      setLoading(false);
      return;
    }

    const scriptLoaded = await paymentService.loadRazorpayScript();
    if (!scriptLoaded) {
      setErrors({ submit: 'Could not load the payment gateway. Check your connection and try again.' });
      setLoading(false);
      return;
    }

    try {
      const rzpOrder = await paymentService.createRazorpayOrder(order.dbOrderId);

      const rzp = new window.Razorpay({
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: rzpOrder.storeName,
        description: `Order ${rzpOrder.orderNumber}`,
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.mobile,
        },
        theme: { color: '#5b2a6e' },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              orderId: order.dbOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            finalizeOrder(order);
          } catch (err) {
            setErrors({ submit: 'Payment verification failed. If any amount was deducted, it will be refunded automatically.' });
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            paymentService.markFailed(order.dbOrderId);
            setErrors({ submit: 'Payment was not completed. You can try again or choose Cash on Delivery.' });
            setLoading(false);
          },
        },
      });

      rzp.on('payment.failed', () => {
        paymentService.markFailed(order.dbOrderId);
        setErrors({ submit: 'Payment failed. Please try again or choose Cash on Delivery.' });
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setErrors({ submit: err.message || 'Could not start online payment. Please try again.' });
      setLoading(false);
    }
  };

  // The customer pays the admin's UPI ID directly (no gateway involved), so
  // there's no signature to verify - we just record whatever UTR/reference
  // they were shown, and the order stays "pending" until the admin checks
  // their own UPI app/bank statement and marks it paid from the admin
  // Payments screen.
  // Reads the chosen screenshot into a base64 data URL so it can go
  // straight into the JSON body alongside the UTR - no separate upload step.
  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setProofError('Please choose a PNG, JPG or WEBP image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setProofError('Image is too large. Please choose one under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result);
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeProof = () => {
    setProofImage(null);
    setProofPreview('');
  };

  const submitUtr = async (e) => {
    e.preventDefault();
    if (!utrInput.trim()) {
      setUtrError('Please enter the UPI reference/UTR number shown after you paid.');
      return;
    }
    setUtrSubmitting(true);
    setUtrError('');
    try {
      await paymentService.submitDirectUpiReference(directUpiOrder.dbOrderId, utrInput.trim(), proofImage);
      finalizeOrder(directUpiOrder);
    } catch (err) {
      setUtrError('Could not save your reference number. Please try again.');
      setUtrSubmitting(false);
    }
  };

  // Lets the customer finish checkout without waiting to pay first - the
  // order is already saved as pending, they can pay in their own time and
  // reference the order number when contacting support if needed.
  const skipUtrForNow = () => finalizeOrder(directUpiOrder);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) return;
    if (cart.some((item) => item.inStock === false)) {
      setErrors((prev) => ({ ...prev, submit: 'Please remove out-of-stock items from your cart before placing the order.' }));
      return;
    }
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
        couponCode: couponApplied && appliedCouponData ? appliedCouponData.code : null,
        giftMessage: giftEnabled ? giftMessage : null,
        subtotal,
        shipping,
        discount,
        total,
      };

      const order = await orderService.placeOrder(orderData);

      if (formData.paymentMethod === 'online') {
        await payOnline(order);
      } else if (formData.paymentMethod === 'directUpi') {
        // Don't finalize yet - show the QR/deep-link and wait for the
        // customer to pay and report back a UTR (see payDirectUpi below).
        if (!order.dbOrderId) {
          setErrors({ submit: 'Could not start UPI payment. Please choose Cash on Delivery instead.' });
          setLoading(false);
          return;
        }
        setDirectUpiOrder(order);
        setLoading(false);
      } else {
        finalizeOrder(order);
      }
    } catch (error) {
      setErrors({ submit: 'Failed to place order. Please try again.' });
      setLoading(false);
    }
  };

  if (directUpiOrder) {
    const upiLink = buildUpiLink({
      upiId: paymentConfig.upiId,
      payeeName: paymentConfig.storeName,
      amount: total,
      note: `Order ${directUpiOrder.id}`,
    });
    return (
      <div className="checkout-page">
        <div className="empty-checkout direct-upi-panel">
          <span className="checkout-kicker">MAYURA REGALIA</span>
          <h1>Pay via UPI</h1>
          <p>Scan the QR with any UPI app, or tap the button below on your phone. Amount: <strong>₹{total.toFixed(2)}</strong></p>

          <div className="upi-qr-box">
            <QRCodeSVG value={upiLink} size={180} />
          </div>
          <p className="upi-id-line">Paying: <strong>{paymentConfig.upiId}</strong></p>
          <a className="btn btn-primary" href={upiLink}>Open UPI app</a>

          <form onSubmit={submitUtr} className="utr-form">
            <label htmlFor="utr">Once you've paid, enter the UPI reference / UTR number</label>
            <input
              id="utr"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value)}
              placeholder="e.g. 3312xxxxxxx"
            />
            {utrError && <span className="error-message">{utrError}</span>}

            <label htmlFor="proof" className="proof-upload-label">
              Add a screenshot of the payment (optional)
            </label>
            {proofPreview ? (
              <div className="proof-preview">
                <img src={proofPreview} alt="Payment screenshot preview" />
                <button type="button" className="link-btn" onClick={removeProof}>Remove image</button>
              </div>
            ) : (
              <input id="proof" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProofChange} />
            )}
            {proofError && <span className="error-message">{proofError}</span>}

            <button type="submit" className="btn btn-primary" disabled={utrSubmitting}>
              {utrSubmitting ? 'SAVING...' : "I'VE PAID"}
            </button>
          </form>
          <button type="button" className="link-btn" onClick={skipUtrForNow}>
            I'll pay later using order {directUpiOrder.id}
          </button>
          <p className="upi-manual-note">
            This order stays "payment pending" until we confirm it against our UPI account &mdash;
            we'll reach out if anything looks off.
          </p>
        </div>
      </div>
    );
  }

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
              {paymentConfig.codEnabled && (
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
              )}

              <label className={`payment-option${paymentConfig.razorpayEnabled ? '' : ' disabled'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={formData.paymentMethod === 'online'}
                  disabled={!paymentConfig.razorpayEnabled}
                  onChange={handleInputChange}
                />
                <span>
                  Pay Online &mdash; Cards, UPI &amp; Netbanking
                  {!paymentConfig.razorpayEnabled && <em className="payment-option-note"> (currently unavailable)</em>}
                </span>
              </label>
              {paymentConfig.directUpiEnabled && (
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="directUpi"
                    checked={formData.paymentMethod === 'directUpi'}
                    onChange={handleInputChange}
                  />
                  <span>Pay via UPI (QR code)</span>
                </label>
              )}
              {paymentConfig.razorpayEnabled && paymentConfig.upiId && (
                <p className="payment-upi-note">You can also pay directly via UPI ID: <strong>{paymentConfig.upiId}</strong></p>
              )}
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
            {loading ? 'PROCESSING...' : cart.length === 0 ? 'YOUR CART IS EMPTY' : 'PLACE ORDER'}
          </button>
        </form>

        <div className="checkout-summary">
          <div className="summary-card bag-card">
            <h2>Your Cart ({cart.length})</h2>

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
                      <button type="button" className="save-later-btn" onClick={() => moveBackToBag(item)}>Move back to cart</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="coupon-box">
              <span className="coupon-icon">🏷️</span>
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  setCouponError('');
                  // Clear applied coupon if the user edits the code.
                  if (couponApplied) { setCouponApplied(false); setAppliedCouponData(null); }
                }}
              />
              <button type="button" onClick={applyCoupon} disabled={couponLoading}>
                {couponLoading ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {couponApplied && appliedCouponData && (
              <p className="coupon-success">🎉 ₹{appliedCouponData.discount} off unlocked with {appliedCouponData.code}</p>
            )}
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
            <div><span>↩️</span>10 Days Return Policy</div>
            <div><span>🏆</span>Trusted Craftsmanship</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

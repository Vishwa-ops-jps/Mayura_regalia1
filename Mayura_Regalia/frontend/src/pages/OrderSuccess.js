import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import orderService from '../services/orderService';
import '../styles/OrderSuccess.css';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      orderService
        .getOrderById(orderId)
        .then((orderData) => {
          setOrder(orderData);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [orderId]);

  if (loading) {
    return <div className="order-success-page loading">Loading...</div>;
  }

  return (
    <div className="order-success-page">
      <div className="success-container">
        <div className="success-icon">✓</div>

        <h1>Thank You for Shopping with MAYURA REGALIA</h1>

        {order && (
          <>
            <div className="order-details">
              <div className="detail-section">
                <h3>Order Number</h3>
                <p className="order-number">{order.id}</p>
              </div>

              <div className="detail-section">
                <h3>Customer Information</h3>
                <p>
                  <strong>{order.customer.fullName}</strong>
                </p>
                <p>{order.customer.email}</p>
                <p>{order.customer.mobile}</p>
              </div>

              <div className="detail-section">
                <h3>Delivery Address</h3>
                <p>{order.deliveryAddress.address}</p>
                <p>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                  {order.deliveryAddress.pincode}
                </p>
              </div>

              <div className="detail-section">
                <h3>Items Ordered</h3>
                <ul className="items-list">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} x ₹{item.price} = ₹
                        {item.quantity * item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal}</span>
                </div>
                {order.shipping > 0 && (
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>₹{order.shipping}</span>
                  </div>
                )}
                {order.shipping === 0 && (
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span className="free">FREE</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{order.total}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Payment Method</h3>
                <p>
                  {order.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'Online Payment'}
                </p>
              </div>
            </div>

            <div className="success-message">
              <p>Your order has been placed successfully!</p>
              <p>
                You will receive an email confirmation shortly with tracking details.
              </p>
            </div>
          </>
        )}

        <Link to="/shop" className="btn btn-primary">
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;

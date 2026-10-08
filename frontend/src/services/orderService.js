import { apiRequest } from './api';
import customerAuthService from './customerAuthService';

const orderService = {
  generateOrderNumber: () => {
    const date = new Date();
    const year = date.getFullYear();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');
    return `MR-${year}-${randomNum}`;
  },

  placeOrder: async (orderData) => {
    let orderNumber = orderService.generateOrderNumber();
    // The backend's numeric order id - needed to create a Razorpay order
    // and to verify payment against the right row. Stays null if the
    // backend call below fails, in which case online payment can't proceed
    // (the caller falls back to Cash on Delivery).
    let dbOrderId = null;

    // Best-effort: persist the order to MySQL so the admin panel (Orders,
    // Payments, Customers) sees it too. The storefront still works via
    // localStorage if the API is unreachable.
    try {
      // If the shopper is logged in to their customer account, attach the
      // token so the order links to their account and shows up in their
      // order history. Guest checkout (no token) works exactly as before.
      const customerToken = customerAuthService.getToken();
      const backendOrder = await apiRequest('/orders', {
        method: 'POST',
        headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : undefined,
        body: JSON.stringify({
          customerName: orderData.customer?.fullName,
          email: orderData.customer?.email,
          phone: orderData.customer?.mobile,
          address: orderData.deliveryAddress?.address,
          city: orderData.deliveryAddress?.city,
          state: orderData.deliveryAddress?.state,
          pincode: orderData.deliveryAddress?.pincode,
          items: (orderData.items || []).map((item) => ({
            productId: item.id, name: item.name, image: item.image,
            price: item.price, quantity: item.quantity,
          })),
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          shippingFee: orderData.shipping,
          total: orderData.total,
          couponCode: orderData.couponCode,
          paymentMethod: orderData.paymentMethod === 'cod'
            ? 'COD'
            : orderData.paymentMethod === 'directUpi'
              ? 'UPI (Direct)'
              : 'Online',
        }),
      });
      orderNumber = backendOrder.orderNumber;
      dbOrderId = backendOrder.id;
    } catch {
      // Ignore and fall back to the locally generated order number.
    }

    const order = {
      id: orderNumber,
      dbOrderId,
      timestamp: new Date(),
      ...orderData,
    };
    localStorage.setItem(`order_${order.id}`, JSON.stringify(order));
    return order;
  },

  getOrderById: (orderId) => {
    const order = localStorage.getItem(`order_${orderId}`);
    if (!order) {
      return Promise.reject(new Error('Order not found'));
    }
    return Promise.resolve(JSON.parse(order));
  },
};

export default orderService;

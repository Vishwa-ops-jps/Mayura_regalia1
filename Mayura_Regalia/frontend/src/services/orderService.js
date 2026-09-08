const orderService = {
  generateOrderNumber: () => {
    const date = new Date();
    const year = date.getFullYear();
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');
    return `MR-${year}-${randomNum}`;
  },

  placeOrder: (orderData) => {
    const order = {
      id: orderService.generateOrderNumber(),
      timestamp: new Date(),
      ...orderData,
    };
    localStorage.setItem(`order_${order.id}`, JSON.stringify(order));
    return Promise.resolve(order);
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

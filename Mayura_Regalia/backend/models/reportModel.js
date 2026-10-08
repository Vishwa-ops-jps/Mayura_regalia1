const { getPool } = require('../config/db');

// Builds the last N calendar days (oldest first) as 'YYYY-MM-DD' strings,
// e.g. for a "last 7 days" chart - so the chart always has 7 slots even on
// days with zero orders, instead of stretching 1-2 bars across the whole width.
function buildDailyRange(days) {
  const range = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    range.push(d.toISOString().slice(0, 10));
  }
  return range;
}

// Same idea for the last N calendar months, as 'YYYY-MM' strings.
function buildMonthlyRange(months) {
  const range = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    range.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return range;
}

// Fills in zero-revenue entries for any key in `range` missing from `rows`,
// so charts always render a fixed number of evenly-spaced bars.
function fillRange(range, rows, keyField) {
  const byKey = new Map(rows.map((r) => [String(r[keyField]), r]));
  return range.map((key) => {
    const row = byKey.get(key);
    return {
      [keyField]: key,
      revenue: row ? Number(row.revenue) : 0,
      orders: row ? Number(row.orders) : 0,
    };
  });
}

async function getDashboardSummary() {
  const pool = getPool();

  const [[productStats]] = await pool.query(
    `SELECT COUNT(*) AS totalProducts,
      SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) AS inStock,
      SUM(CASE WHEN in_stock = 0 THEN 1 ELSE 0 END) AS outOfStock,
      SUM(CASE WHEN stock_quantity <= low_stock_threshold AND stock_quantity > 0 THEN 1 ELSE 0 END) AS lowStock,
      COALESCE(AVG(rating),0) AS avgRating,
      COALESCE(AVG(price),0) AS avgPrice
     FROM products`
  );

  const [[orderStats]] = await pool.query(
    `SELECT COUNT(*) AS totalOrders,
      COALESCE(SUM(total),0) AS totalRevenue,
      SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
      SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
      SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledOrders
     FROM orders`
  );

  const [[customerStats]] = await pool.query(`SELECT COUNT(*) AS totalCustomers FROM customers`);
  const [[categoryStats]] = await pool.query(`SELECT COUNT(*) AS totalCategories FROM categories`);
  const [[couponStats]] = await pool.query(`SELECT SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS activeCoupons FROM coupons`);
  const [[reviewStats]] = await pool.query(`SELECT SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingReviews FROM reviews`);

  const [recentOrders] = await pool.query(
    `SELECT id, order_number AS orderNumber, customer_name AS customerName, total, order_status AS orderStatus,
      payment_status AS paymentStatus, created_at AS createdAt
     FROM orders ORDER BY id DESC LIMIT 6`
  );

  const [topProducts] = await pool.query(
    `SELECT oi.product_name AS name, SUM(oi.quantity) AS unitsSold, SUM(oi.subtotal) AS revenue
     FROM order_items oi GROUP BY oi.product_name ORDER BY unitsSold DESC LIMIT 5`
  );

  const [revenueTrendRows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
     FROM orders WHERE created_at >= (CURDATE() - INTERVAL 6 DAY)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY date ASC`
  );
  const revenueTrend = fillRange(buildDailyRange(7), revenueTrendRows, 'date');

  // Category-wise sales split, for the dashboard pie/donut chart.
  const [categoryBreakdown] = await pool.query(
    `SELECT p.category AS category, COALESCE(SUM(oi.subtotal),0) AS revenue, SUM(oi.quantity) AS units
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     GROUP BY p.category ORDER BY revenue DESC LIMIT 8`
  );

  // Month-by-month revenue for the last 6 months, for the stock-style up/down chart.
  const [monthlyRevenueRows] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
     FROM orders WHERE created_at >= (DATE_SUB(CURDATE(), INTERVAL 5 MONTH))
     GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`
  );
  const monthlyRevenue = fillRange(buildMonthlyRange(6), monthlyRevenueRows, 'month');

  return {
    totalProducts: Number(productStats.totalProducts || 0),
    inStock: Number(productStats.inStock || 0),
    outOfStock: Number(productStats.outOfStock || 0),
    lowStock: Number(productStats.lowStock || 0),
    avgRating: Number(productStats.avgRating || 0),
    avgPrice: Number(productStats.avgPrice || 0),
    totalOrders: Number(orderStats.totalOrders || 0),
    totalRevenue: Number(orderStats.totalRevenue || 0),
    pendingOrders: Number(orderStats.pendingOrders || 0),
    deliveredOrders: Number(orderStats.deliveredOrders || 0),
    cancelledOrders: Number(orderStats.cancelledOrders || 0),
    totalCustomers: Number(customerStats.totalCustomers || 0),
    totalCategories: Number(categoryStats.totalCategories || 0),
    activeCoupons: Number(couponStats.activeCoupons || 0),
    pendingReviews: Number(reviewStats.pendingReviews || 0),
    recentOrders,
    topProducts: topProducts.map((p) => ({ ...p, unitsSold: Number(p.unitsSold), revenue: Number(p.revenue) })),
    // Already zero-filled to a fixed number of slots by fillRange() above.
    revenueTrend,
    categoryBreakdown: categoryBreakdown.map((r) => ({ category: r.category || 'Uncategorised', revenue: Number(r.revenue), units: Number(r.units || 0) })),
    monthlyRevenue,
  };
}

async function getSalesReport({ days = 30 } = {}) {
  const pool = getPool();
  const [salesByDay] = await pool.query(
    `SELECT DATE(created_at) AS date, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders
     FROM orders WHERE created_at >= (CURDATE() - INTERVAL ? DAY)
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [Number(days)]
  );
  const [salesByCategory] = await pool.query(
    `SELECT p.category AS category, COALESCE(SUM(oi.subtotal),0) AS revenue, SUM(oi.quantity) AS units
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     GROUP BY p.category ORDER BY revenue DESC`
  );
  const [statusBreakdown] = await pool.query(
    `SELECT order_status AS status, COUNT(*) AS count FROM orders GROUP BY order_status`
  );
  const [paymentBreakdown] = await pool.query(
    `SELECT method, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total FROM payments GROUP BY method`
  );
  return {
    salesByDay: salesByDay.map((r) => ({ ...r, revenue: Number(r.revenue), orders: Number(r.orders) })),
    salesByCategory: salesByCategory.map((r) => ({ category: r.category || 'Uncategorised', revenue: Number(r.revenue), units: Number(r.units || 0) })),
    statusBreakdown: statusBreakdown.map((r) => ({ ...r, count: Number(r.count) })),
    paymentBreakdown: paymentBreakdown.map((r) => ({ ...r, count: Number(r.count), total: Number(r.total) })),
  };
}

module.exports = { getDashboardSummary, getSalesReport };

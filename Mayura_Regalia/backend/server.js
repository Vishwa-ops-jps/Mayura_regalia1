require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const { findByEmail, createAdmin } = require('./models/adminModel');
const bcrypt = require('bcryptjs');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const giftRoutes = require('./routes/giftRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const customerRoutes = require('./routes/customerRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingRoutes = require('./routes/settingRoutes');
const { seedProducts } = require('./utils/seedProducts');
const { seedAdminExtras } = require('./utils/seedAdminExtras');

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
// Raised from Express's 100kb default: images (product photos, payment
// screenshots) are uploaded as base64 data URLs in the JSON body.
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MAYURA REGALIA API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);

// Serve the built React app (storefront + /admin) so this one backend
// service can also host the frontend on Render/Railway/etc. If you deploy
// the frontend as its own static site instead, this block is harmless -
// it only kicks in when frontend/build actually exists.
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(frontendBuildPath));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

async function ensureAdmin() {
  const email = String(process.env.ADMIN_EMAIL || 'admin@mayuraregalia.com').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || 'Admin@123');
  const existing = await findByEmail(email);
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await createAdmin({ name: 'Mayura Admin', email, passwordHash });
    console.log(`Default admin created: ${email}`);
  }
}

(async () => {
  try {
    await initializeDatabase();
    await ensureAdmin();
    const seeded = await seedProducts();
    if (seeded) console.log('Seeded initial MAYURA REGALIA products into MySQL');
    await seedAdminExtras();
    app.listen(PORT, () => console.log(`MAYURA REGALIA API running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
})();

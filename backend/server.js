require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');
const { findByEmail, createAdmin } = require('./models/adminModel');
const bcrypt = require('bcryptjs');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const { seedProducts } = require('./utils/seedProducts');

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MAYURA REGALIA API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

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
    app.listen(PORT, () => console.log(`MAYURA REGALIA API running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
})();

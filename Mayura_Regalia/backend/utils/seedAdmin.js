require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeDatabase } = require('../config/db');
const { findByEmail, createAdmin } = require('../models/adminModel');

(async () => {
  await initializeDatabase();
  const email = String(process.env.ADMIN_EMAIL || 'admin@mayuraregalia.com').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || 'Admin@123');
  const existing = await findByEmail(email);

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await createAdmin({ name: 'Mayura Admin', email, passwordHash });
    console.log(`Admin created: ${email}`);
  }
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

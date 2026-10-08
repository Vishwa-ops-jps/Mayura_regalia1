const { getPool } = require('../config/db');
const categoryModel = require('../models/categoryModel');
const bannerModel = require('../models/bannerModel');
const couponModel = require('../models/couponModel');
const giftModel = require('../models/giftModel');

// Seeds a small starter set of admin data (categories, banners, coupons, gifts)
// so the new admin modules aren't empty on first run. Safe to run every boot.
async function seedAdminExtras() {
  const pool = getPool();

  const [[{ count: categoryCount }]] = await pool.query('SELECT COUNT(*) AS count FROM categories');
  if (Number(categoryCount) === 0) {
    const [rows] = await pool.query('SELECT DISTINCT category FROM products');
    let i = 0;
    for (const row of rows) {
      await categoryModel.create({ name: row.category, sortOrder: i++, status: 'active' });
    }
  }

  const [[{ count: bannerCount }]] = await pool.query('SELECT COUNT(*) AS count FROM banners');
  if (Number(bannerCount) === 0) {
    await bannerModel.create({
      title: 'Festive Jewellery Sale', subtitle: 'Up to 50% off on bridal collections',
      image: '/products/regalia-5.jpg', link: '/shop', position: 'home_hero', status: 'active', sortOrder: 0,
    });
  }

  const [[{ count: couponCount }]] = await pool.query('SELECT COUNT(*) AS count FROM coupons');
  if (Number(couponCount) === 0) {
    await couponModel.create({
      code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 999,
      maxDiscount: 500, usageLimit: null, status: 'active',
    });
  }

  const [[{ count: giftCount }]] = await pool.query('SELECT COUNT(*) AS count FROM gifts');
  if (Number(giftCount) === 0) {
    await giftModel.create({
      name: 'Premium Gift Wrap', description: 'Elegant box wrapping with a handwritten note',
      price: 99, status: 'active',
    });
  }
}

module.exports = { seedAdminExtras };

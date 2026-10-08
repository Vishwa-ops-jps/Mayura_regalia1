const model = require('../models/couponModel');
const { buildCrudController } = require('../utils/crudController');

const base = buildCrudController(model, 'Coupon');

async function validate(req, res) {
  try {
    const { code, subtotal } = req.body;
    const coupon = await model.findByCode(code);
    if (!coupon || coupon.status !== 'active') {
      return res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });
    }
    const amount = Number(subtotal || 0);
    if (amount < Number(coupon.minOrderAmount || 0)) {
      return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }
    let discount = coupon.type === 'percentage' ? (amount * Number(coupon.value)) / 100 : Number(coupon.value);
    if (coupon.maxDiscount != null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.min(discount, amount);
    res.json({ code: coupon.code, discount: Math.round(discount * 100) / 100, type: coupon.type, value: coupon.value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to validate coupon' });
  }
}

module.exports = { ...base, validate };

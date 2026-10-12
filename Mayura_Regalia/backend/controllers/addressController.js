const model = require('../models/addressModel');

async function list(req, res) {
  try {
    res.json(await model.findByCustomer(req.customer.id));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load addresses' });
  }
}

async function create(req, res) {
  try {
    const { label, address, city, state, pincode, isDefault } = req.body;
    if (!address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Address, city, state and pincode are required' });
    }
    if (!/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ message: 'Enter a valid 6-digit pincode' });
    }
    const n = await model.count(req.customer.id);
    if (n >= 5) {
      return res.status(400).json({ message: 'You can save up to 5 addresses. Please remove one first.' });
    }
    const addr = await model.create(req.customer.id, { label, address, city, state, pincode, isDefault: Boolean(isDefault || n === 0) });
    res.status(201).json(addr);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to save address' });
  }
}

async function update(req, res) {
  try {
    const { label, address, city, state, pincode, isDefault } = req.body;
    if (!address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Address, city, state and pincode are required' });
    }
    const addr = await model.update(req.params.id, req.customer.id, { label, address, city, state, pincode, isDefault });
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    res.json(addr);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update address' });
  }
}

async function remove(req, res) {
  try {
    const ok = await model.remove(req.params.id, req.customer.id);
    if (!ok) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address removed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to remove address' });
  }
}

async function setDefault(req, res) {
  try {
    const addr = await model.setDefault(req.params.id, req.customer.id);
    if (!addr) return res.status(404).json({ message: 'Address not found' });
    res.json(addr);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to set default address' });
  }
}

module.exports = { list, create, update, remove, setDefault };

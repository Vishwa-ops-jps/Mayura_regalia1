const model = require('../models/reviewModel');
const { buildCrudController } = require('../utils/crudController');

const base = buildCrudController(model, 'Review', { listFilters: ['status'] });

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const row = await model.updateStatus(req.params.id, status);
    if (!row) return res.status(404).json({ message: 'Review not found' });
    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update review status' });
  }
}

module.exports = { ...base, updateStatus };

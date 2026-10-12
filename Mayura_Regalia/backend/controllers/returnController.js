const orderModel = require('../models/orderModel');

async function list(req, res) {
  try {
    res.json(await orderModel.findReturnRequests({ status: req.query.status, search: req.query.search }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load return requests' });
  }
}

async function update(req, res) {
  try {
    const status = String(req.body.status || '').trim().toLowerCase();
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid return request status' });
    }
    const request = await orderModel.updateReturnRequest(req.params.id, { status, adminNote: req.body.adminNote });
    if (!request) return res.status(404).json({ message: 'Return request not found' });
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update return request' });
  }
}

module.exports = { list, update };

const reportModel = require('../models/reportModel');

async function getSummary(req, res) {
  try {
    res.json(await reportModel.getDashboardSummary());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load dashboard summary' });
  }
}

async function getSalesReport(req, res) {
  try {
    res.json(await reportModel.getSalesReport({ days: req.query.days || 30 }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load sales report' });
  }
}

module.exports = { getSummary, getSalesReport };

const model = require('../models/settingModel');

async function getSettings(req, res) {
  try {
    res.json(await model.getAll());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load settings' });
  }
}

async function updateSettings(req, res) {
  try {
    res.json(await model.updateMany(req.body));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
}

module.exports = { getSettings, updateSettings };

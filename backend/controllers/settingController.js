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

async function getHero(req, res) {
  try {
    res.json({ slides: await model.getHero() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load hero slides' });
  }
}

async function resetHeroSlides(req, res) {
  try {
    // Overwrite whatever is in the DB with the code-level defaults.
    // This clears any stale file-path image references stored from a previous
    // version of the app (e.g. "/products/JewelsSet.jpeg").
    const updated = await model.updateMany({ heroSlides: JSON.stringify(model.DEFAULT_HERO_SLIDES) });
    res.json({ message: 'Hero slides reset to defaults.', slides: model.DEFAULT_HERO_SLIDES, settings: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset hero slides' });
  }
}

async function getGoldPrices(req, res) {
  try {
    res.json(await model.getGoldPrices());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load gold prices' });
  }
}

module.exports = { getSettings, updateSettings, getHero, resetHeroSlides, getGoldPrices };

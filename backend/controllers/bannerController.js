const model = require('../models/bannerModel');
const { buildCrudController } = require('../utils/crudController');
module.exports = buildCrudController(model, 'Banner', { listFilters: ['status', 'position'] });

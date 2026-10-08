const model = require('../models/giftModel');
const { buildCrudController } = require('../utils/crudController');
module.exports = buildCrudController(model, 'Gift', { listFilters: ['status'] });

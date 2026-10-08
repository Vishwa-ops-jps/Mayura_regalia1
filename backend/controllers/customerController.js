const model = require('../models/customerModel');
const { buildCrudController } = require('../utils/crudController');
module.exports = buildCrudController(model, 'Customer', { listFilters: ['search'] });

const model = require('../models/categoryModel');
const { buildCrudController } = require('../utils/crudController');
module.exports = buildCrudController(model, 'Category', { listFilters: ['status'] });

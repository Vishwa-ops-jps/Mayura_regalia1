const model = require('../models/collectionModel');
const { buildCrudController } = require('../utils/crudController');
module.exports = buildCrudController(model, 'Collection', { listFilters: ['status'] });

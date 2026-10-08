// Generic CRUD controller factory for simple admin-managed resources.
function buildCrudController(model, resourceName, { listFilters = [] } = {}) {
  return {
    async list(req, res) {
      try {
        const filters = {};
        listFilters.forEach((f) => { if (req.query[f] !== undefined) filters[f] = req.query[f]; });
        const rows = await model.findAll(filters);
        res.json(rows);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to load ${resourceName}` });
      }
    },
    async getOne(req, res) {
      try {
        const row = await model.findById(req.params.id);
        if (!row) return res.status(404).json({ message: `${resourceName} not found` });
        res.json(row);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to load ${resourceName}` });
      }
    },
    async create(req, res) {
      try {
        const row = await model.create(req.body);
        res.status(201).json(row);
      } catch (error) {
        console.error(error);
        const dup = error && error.code === 'ER_DUP_ENTRY';
        res.status(dup ? 409 : 500).json({ message: dup ? `That ${resourceName} already exists` : `Failed to create ${resourceName}` });
      }
    },
    async update(req, res) {
      try {
        const row = await model.update(req.params.id, req.body);
        if (!row) return res.status(404).json({ message: `${resourceName} not found` });
        res.json(row);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to update ${resourceName}` });
      }
    },
    async remove(req, res) {
      try {
        const deleted = await model.remove(req.params.id);
        if (!deleted) return res.status(404).json({ message: `${resourceName} not found` });
        res.json({ message: `${resourceName} deleted successfully` });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to delete ${resourceName}` });
      }
    },
  };
}

module.exports = { buildCrudController };

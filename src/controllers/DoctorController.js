class DoctorController {
    async getAll(req, res) {

        // TODO: Implement get all logic
        res.json({ success: true, data: [] });
    
    }

    async getById(req, res) {
        
        const { id } = req.params;
        // TODO: Implement get by ID logic
        res.json({ success: true, data: { id } });
        
    }

    async create(req, res) {
        
        const data = req.body;

        // TODO: Implement create logic
        res.status(201).json({ success: true, data });
        
    }

    async update(req, res) {

        const { id } = req.params;
        const data = req.body;
        // TODO: Implement update logic
        res.json({ success: true, data: { id, ...data } });
    }

    async delete(req, res) {
        
        const { id } = req.params;
        // TODO: Implement delete logic
        res.json({ success: true, message: 'Deleted successfully' });
        
    }
}

module.exports = new DoctorController();

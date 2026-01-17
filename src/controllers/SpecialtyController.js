const collection = require("../utils/collection");
const Specialty = require("../models/Specialty");

class SpecialtyController {
    /**
     * @desc    Retrieve all medical specialties
     * @route   GET /specialties
     * @access  Public / Protected (based on system design)
     *
     * This method fetches all specialties ordered by creation date (newest first).
     */
    async getAll(req, res, next) {
        const data = await Specialty.find().sort({createdAt: -1});
        return res.status(200).json(
            collection(true, "Specialties retrieved successfully", data, "SUCCESS")
        );
    }

    /**
     * @desc    Retrieve a single specialty by ID
     * @route   GET /specialties/:id
     * @access  Public / Protected
     *
     * This method retrieves a specific specialty using its unique identifier.
     */
    async getById(req, res, next) {
        const {id} = req.params;
        const data = await Specialty.findById(id);
        if (!data) {
            const error = new Error("Specialty not found");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(
            collection(true, "Specialty retrieved successfully", data, "SUCCESS")
        );
    }

    /**
     * @desc    Create a new specialty
     * @route   POST /specialties
     * @access  Protected (Admin)
     *
     * This method creates a new medical specialty record.
     */
    async create(req, res, next) {
        const data = new Specialty(req.body);
        await data.save();
        return res.status(201).json(
            collection(true, "Specialty created successfully", data, "CREATED")
        );
    }

    /**
     * @desc    Update an existing specialty
     * @route   PUT /specialties/:id
     * @access  Protected (Admin)
     *
     * This method updates specialty data and enforces schema validation rules.
     */
    async update(req, res, next) {
        const {id} = req.params;
        const data = await Specialty.findByIdAndUpdate(
            id,
            req.body,
            {new: true, runValidators: true}
        );
        if (!data) {
            const error = new Error("Specialty not found");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(
            collection(true, "Specialty updated successfully", data, "UPDATED")
        );
    }

    /**
     * @desc    Delete a specialty
     * @route   DELETE /specialties/:id
     * @access  Protected (Admin)
     *
     * This method permanently removes a specialty record from the system.
     */
    async delete(req, res, next) {
        const {id} = req.params;
        const data = await Specialty.findByIdAndDelete(id);
        if (!data) {
            const error = new Error("Specialty not found");
            error.statusCode = 404;
            return next(error);
        }
        return res.status(200).json(
            collection(true, "Specialty deleted successfully", null, "DELETED")
        );
    }
}

module.exports = new SpecialtyController();
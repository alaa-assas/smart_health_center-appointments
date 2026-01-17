const collection = require("../utils/collection");
const Specialty = require("../models/Specialty");

class SpecialtyController {
    async getAll(req, res, next) {
        const data = await Specialty.find().sort({createdAt: -1});
        return res.status(200).json(
            collection(true, "Specialties retrieved successfully", data, "SUCCESS")
        );
    }

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

    async create(req, res, next) {
        const data = new Specialty(req.body);
        await data.save();
        return res.status(201).json(
            collection(true, "Specialty created successfully", data, "CREATED")
        );
    }

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
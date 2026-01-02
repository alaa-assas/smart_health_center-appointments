const Specialty = require("../models/Specialty");

class SpecialtyController {
  async getAll(req, res, next) {
    try {
      const specialties = await Specialty.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        count: specialties.length,
        data: specialties,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const specialty = await Specialty.findById(id);

      if (!specialty) {
        const error = new Error("Specialty not found");
        error.statusCode = 404;
        return next(error);
      }

      res.status(200).json({ success: true,  specialty });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const specialty = new Specialty({ name, description });
      await specialty.save();

      res.status(201).json({
        success: true,
        message: "Specialty created successfully",
        data: specialty,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const specialty = await Specialty.findByIdAndUpdate(
        id,
        { name, description },
        {
          new: true,
          runValidators: true,
          context: "query",
        }
      );

      if (!specialty) {
        const error = new Error("Specialty not found");
        error.statusCode = 404;
        return next(error);
      }

      res.status(200).json({
        success: true,
        message: "Specialty updated successfully",
         specialty,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const specialty = await Specialty.findByIdAndDelete(id);

      if (!specialty) {
        const error = new Error("Specialty not found");
        error.statusCode = 404;
        return next(error);
      }

      res.status(200).json({
        success: true,
        message: "Specialty deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SpecialtyController;
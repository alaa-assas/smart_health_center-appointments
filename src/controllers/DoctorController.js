const collection = require("../utils/collection");
const Doctor = require("../models/Doctor");

class DoctorController {
  async getAll(req, res, next) {
    try {
      const {
        specialty,
        minRating = 0,
        maxRating = 5,
        minExperience = 0,
        search,
        page = 1,
        limit = 10,
      } = req.query;

      // build this object if we need filter our search
      const filter = {};

      if (specialty) {
        filter.specialtyId = specialty;
      }

      //  filter by rating
      filter.avgRating = {
        $gte: parseFloat(minRating),
        $lte: parseFloat(maxRating),
      };

      // filter by experience
      if (minExperience) {
        filter.yearsOfExperience = { $gte: parseInt(minExperience) };
      }

      // filter in anuther way
      if (search) {
        filter.$or = [
          { medicalSchool: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
        ];
      }

      // do the pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const doctors = await Doctor.find(filter)
        .populate("specialtyId", "name description")
        .populate({
          path: "userId",
          select: "fullName email ",
        })
        .sort({ avgRating: -1, yearsOfExperience: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Doctor.countDocuments(filter);

      return res.status(200).json(
        collection(
          true,
          "Doctors retrieved successfully",
          {
            doctors,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total,
              pages: Math.ceil(total / parseInt(limit)),
            },
          },
          "SUCCESS"
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = await Doctor.findById(id)
        .populate("specialtyId", "name description")
        .populate({
          path: "userId",
          select: "fullName email phone address",
        });

      if (!doctor) {
        const error = new Error("Doctor not found");
        error.statusCode = 404;
        return next(error);
      }

      return res
        .status(200)
        .json(
          collection(true, "Doctor retrieved successfully", doctor, "SUCCESS")
        );
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const doctor = new Doctor(req.body);
      await doctor.save();

      const populatedDoctor = await Doctor.findById(doctor._id)
        .populate("specialtyId", "name")
        .populate({
          path: "userId",
          select: "fullName email",
        });

      return res
        .status(201)
        .json(
          collection(
            true,
            "Doctor created successfully",
            populatedDoctor,
            "CREATED"
          )
        );
    } catch (error) {
      // for duplicate Error
      if (error.code === 11000) {
        const duplicateError = new Error("User already has a doctor profile");
        duplicateError.statusCode = 409;
        return next(duplicateError);
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      // can not add a new user id because it is wrong
      if (req.body.userId) {
        delete req.body.userId;
      }

      const doctor = await Doctor.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("specialtyId", "name")
        .populate({
          path: "userId",
          select: "fullName email",
        });

      if (!doctor) {
        const error = new Error("Doctor not found");
        error.statusCode = 404;
        return next(error);
      }

      return res
        .status(200)
        .json(
          collection(true, "Doctor updated successfully", doctor, "UPDATED")
        );
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const doctor = await Doctor.findByIdAndDelete(id);

      if (!doctor) {
        const error = new Error("Doctor not found");
        error.statusCode = 404;
        return next(error);
      }

      return res
        .status(200)
        .json(collection(true, "Doctor deleted successfully", null, "DELETED"));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();

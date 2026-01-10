const collection = require("../utils/collection");
const Doctor = require("../models/Doctor");
const DoctorSchedule = require("../models/DoctorSchedule");

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
        showInactive = false,
      } = req.query;

      const filter = {};

      if (showInactive !== "true") {
        filter.isActive = true;
      }

      if (specialty) {
        filter.specialtyId = specialty;
      }

      filter.avgRating = {
        $gte: parseFloat(minRating),
        $lte: parseFloat(maxRating),
      };

      if (minExperience) {
        filter.yearsOfExperience = { $gte: parseInt(minExperience) };
      }

      if (search) {
        filter.$or = [
          { medicalSchool: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const doctors = await Doctor.find(filter)
        .populate("specialtyId", "name description")
        .populate({
          path: "userId",
          select: "fullName email",
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

      const schedule = await DoctorSchedule.findOne({
        doctorId: id,
        isActive: true,
      });

      const response = {
        doctor,
        schedule: schedule || null,
      };

      return res
        .status(200)
        .json(
          collection(true, "Doctor retrieved successfully", response, "SUCCESS")
        );
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { schedule, ...doctorData } = req.body;

      const doctor = new Doctor(doctorData);
      await doctor.save();

      let doctorSchedule = null;
      if (schedule) {
        doctorSchedule = new DoctorSchedule({
          doctorId: doctor._id,
          ...schedule,
        });
        await doctorSchedule.save();
      }

      const populatedDoctor = await Doctor.findById(doctor._id)
        .populate("specialtyId", "name")
        .populate({
          path: "userId",
          select: "fullName email",
        });

      const response = {
        doctor: populatedDoctor,
        schedule: doctorSchedule,
      };

      return res
        .status(201)
        .json(
          collection(true, "Doctor created successfully", response, "CREATED")
        );
    } catch (error) {
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
      const { schedule, ...doctorData } = req.body;

      // prevent change userId
      if (doctorData.userId) {
        delete doctorData.userId;
      }
      // cheack if the doctor is active
      const existingDoctor = await Doctor.findOne({ _id: id, isActive: true });
      if (!existingDoctor) {
        const error = new Error("Doctor not found or is inactive");
        error.statusCode = 404;
        return next(error);
      }

      const doctor = await Doctor.findByIdAndUpdate(id, doctorData, {
        new: true,
        runValidators: true,
      })
        .populate("specialtyId", "name")
        .populate({
          path: "userId",
          select: "fullName email",
        });

      let updatedSchedule = null;
      if (schedule) {
        updatedSchedule = await DoctorSchedule.findOneAndUpdate(
          { doctorId: id, isActive: true },
          schedule,
          { new: true, runValidators: true, upsert: true }
        );
      }

      const response = {
        doctor,
        schedule: updatedSchedule,
      };

      return res
        .status(200)
        .json(
          collection(true, "Doctor updated successfully", response, "UPDATED")
        );
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!doctor) {
        const error = new Error("Doctor not found");
        error.statusCode = 404;
        return next(error);
      }

      await DoctorSchedule.findOneAndUpdate(
        { doctorId: id },
        { isActive: false },
        { new: true }
      );

      return res
        .status(200)
        .json(
          collection(
            true,
            "Doctor deactivated successfully",
            null,
            "DEACTIVATED"
          )
        );
    } catch (error) {
      next(error);
    }
  }
  // function for restore the deleted doctor
  async restore(req, res, next) {
    try {
      const { id } = req.params;

      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
      );

      if (!doctor) {
        const error = new Error("Doctor not found");
        error.statusCode = 404;
        return next(error);
      }

      await DoctorSchedule.findOneAndUpdate(
        { doctorId: id },
        { isActive: true },
        { new: true }
      );

      return res
        .status(200)
        .json(
          collection(true, "Doctor restored successfully", doctor, "RESTORED")
        );
    } catch (error) {
      next(error);
    }
  }

  // function for get schedule belong to a doctor
  async getSchedule(req, res, next) {
    try {
      const { id } = req.params;

      // cheack if doctor is active
      const doctor = await Doctor.findOne({ _id: id, isActive: true });
      if (!doctor) {
        const error = new Error("Doctor not found or is inactive");
        error.statusCode = 404;
        return next(error);
      }

      const schedule = await DoctorSchedule.findOne({
        doctorId: id,
        isActive: true,
      });

      if (!schedule) {
        return res
          .status(200)
          .json(
            collection(
              true,
              "No active schedule found for this doctor",
              null,
              "SUCCESS"
            )
          );
      }

      return res
        .status(200)
        .json(
          collection(
            true,
            "Schedule retrieved successfully",
            schedule,
            "SUCCESS"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();

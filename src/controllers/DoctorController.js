const collection = require("../utils/collection");
const Doctor = require("../models/Doctor");
const DoctorSchedule = require("../models/DoctorSchedule");
const User = require("../models/User");
const passwordService = require("../utils/passwordService");

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
      const { schedule, ...allData } = req.body;

      // division the data
      const userData = {
        email: allData.email,
        password: allData.password,
        fullName: allData.fullName,
        phone: allData.phone,
        dateOfBirth: allData.dateOfBirth,
        address: allData.address,
      };

      const doctorData = {
        specialtyId: allData.specialtyId,
        bio: allData.bio,
        yearsOfExperience: allData.yearsOfExperience,
        certifications: allData.certifications,
        graduationYear: allData.graduationYear,
        medicalSchool: allData.medicalSchool,
      };

      if (!userData.email || !userData.password || !userData.fullName) {
        const error = new Error("Email, password and fullName are required");
        error.statusCode = 400;
        return next(error);
      }

      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        const error = new Error("Email already exists");
        error.statusCode = 409;
        return next(error);
      }

      if (!doctorData.specialtyId) {
        const error = new Error("Specialty ID is required for doctor");
        error.statusCode = 400;
        return next(error);
      }

      try {
        passwordService.validatePasswordStrength(userData.password);
      } catch (error) {
        error.statusCode = 400;
        return next(error);
      }

      const hashedPassword = await passwordService.hashPassword(
        userData.password
      );

      //  build the new user with role: 'doctor'
      const user = await User.create({
        email: userData.email,
        passwordHash: hashedPassword,
        fullName: userData.fullName,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address,
        role: "doctor",
      });

      // build doctior
      const doctor = new Doctor({
        userId: user._id,
        specialtyId: doctorData.specialtyId,
        bio: doctorData.bio || "",
        avgRating: 0,
        yearsOfExperience: doctorData.yearsOfExperience || 0,
        certifications: doctorData.certifications || [],
        graduationYear: doctorData.graduationYear,
        medicalSchool: doctorData.medicalSchool || "",
      });
      await doctor.save();

      // conect the doctor with user
      user.doctor = doctor._id;
      await user.save();

      let doctorSchedule = null;
      if (schedule) {
        doctorSchedule = new DoctorSchedule({
          doctorId: doctor._id,
          ...schedule,
        });
        await doctorSchedule.save();
      }
      const populatedDoctor = await Doctor.findById(doctor._id)
        .populate("specialtyId", "name description")
        .populate({
          path: "userId",
          select: "fullName email phone",
        });

      const response = {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          doctor: doctor._id,
        },
        doctor: populatedDoctor,
        schedule: doctorSchedule,
      };

      return res
        .status(201)
        .json(
          collection(
            true,
            "Doctor user created successfully",
            response,
            "CREATED"
          )
        );
    } catch (error) {
      // if something wrong
      if (error.user && error.user._id) {
        await User.findByIdAndDelete(error.user._id);
      }
      if (error.doctor && error.doctor._id) {
        await Doctor.findByIdAndDelete(error.doctor._id);
      }
      if (error.doctorSchedule && error.doctorSchedule._id) {
        await DoctorSchedule.findByIdAndDelete(error.doctorSchedule._id);
      }

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

  async getSchedule(req, res, next) {
    try {
      const { id } = req.params;

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

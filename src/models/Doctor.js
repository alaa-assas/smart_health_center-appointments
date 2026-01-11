const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: [true, "User already has a doctor profile"],
    },
    specialtyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
      required: [true, "Specialty is required"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio is too long (maximum 1000 characters)"],
    },
    avgRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
      set: (v) => parseFloat(v.toFixed(1)),
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, "Years of experience cannot be negative"],
    },
    certifications: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Certification name is too long"],
      },
    ],
    graduationYear: {
      type: Number,
      min: [1900, "Graduation year seems invalid"],
      max: [
        new Date().getFullYear(),
        "Graduation year cannot be in the future",
      ],
    },
    medicalSchool: {
      type: String,
      trim: true,
      maxlength: [200, "Medical school name is too long"],
    },
    // Add for Soft Delete
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);

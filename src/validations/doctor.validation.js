const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const doctorValidation = {
  create: [
    body("userId")
      .notEmpty()
      .withMessage("User ID is required")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid User ID format"),

    body("specialtyId")
      .notEmpty()
      .withMessage("Specialty ID is required")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Specialty ID format"),

    body("bio")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Bio must not exceed 1000 characters"),

    body("yearsOfExperience")
      .optional({ nullable: true })
      .isInt({ min: 0 })
      .withMessage("Years of experience must be a non-negative integer"),

    body("certifications")
      .optional({ nullable: true })
      .isArray()
      .withMessage("Certifications must be an array")
      .custom((certs) => {
        if (certs && certs.length > 10) {
          throw new Error("Cannot have more than 10 certifications");
        }
        return true;
      }),

    body("graduationYear")
      .optional({ nullable: true })
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage("Graduation year must be between 1900 and current year"),

    body("medicalSchool")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("Medical school name must not exceed 200 characters"),
  ],

  update: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Doctor ID format"),

    body("specialtyId")
      .optional({ nullable: true })
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Specialty ID format"),

    body("bio")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Bio must not exceed 1000 characters"),

    body("yearsOfExperience")
      .optional({ nullable: true })
      .isInt({ min: 0 })
      .withMessage("Years of experience must be a non-negative integer"),

    body("certifications")
      .optional({ nullable: true })
      .isArray()
      .withMessage("Certifications must be an array")
      .custom((certs) => {
        if (certs && certs.length > 10) {
          throw new Error("Cannot have more than 10 certifications");
        }
        return true;
      }),

    body("graduationYear")
      .optional({ nullable: true })
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage("Graduation year must be between 1900 and current year"),

    body("medicalSchool")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("Medical school name must not exceed 200 characters"),
  ],

  getById: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Doctor ID format"),
  ],

  delete: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Doctor ID format"),
  ],

  getAll: [
    query("specialty")
      .optional({ nullable: true })
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Specialty ID format"),

    query("minRating")
      .optional({ nullable: true })
      .isFloat({ min: 0, max: 5 })
      .withMessage("Minimum rating must be between 0 and 5"),

    query("maxRating")
      .optional({ nullable: true })
      .isFloat({ min: 0, max: 5 })
      .withMessage("Maximum rating must be between 0 and 5"),

    query("minExperience")
      .optional({ nullable: true })
      .isInt({ min: 0 })
      .withMessage("Minimum experience must be a non-negative integer"),

    query("search")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage("Search query is too long"),
  ],
};

module.exports = doctorValidation;

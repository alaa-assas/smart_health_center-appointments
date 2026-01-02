const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const specialtyValidation = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Specialty name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Specialty name must be between 2 and 100 characters")
      .matches(/\S/)
      .withMessage("Specialty name cannot be empty or whitespace only"),

    body("description")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
  ],

  update: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid ID format"),

    body("name")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Specialty name must be between 2 and 100 characters")
      .matches(/\S/)
      .withMessage("Specialty name cannot be empty or whitespace only"),

    body("description")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),
  ],

  getById: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid ID format"),
  ],

  delete: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid ID format"),
  ],
};

module.exports = specialtyValidation;
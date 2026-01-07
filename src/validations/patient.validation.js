const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const patientValidation = {

  create: [
    body("userId")
      .notEmpty().withMessage("User ID is required")
      .isMongoId().withMessage("Invalid User ID format"),
    
    body("gender")
      .optional()
      .isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
    
    body("chronicConditions")
      .optional()
      .isArray().withMessage("Chronic conditions must be an array of strings"),
  ],

  update: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid Patient ID format"),
    
    body("gender")
      .optional()
      .isIn(["male", "female", "other"]),
    
    body("chronicConditions")
      .optional()
      .isArray(),
    
    body("isActive")
      .optional()
      .isBoolean()
  ],

  getById: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("The provided Patient ID is invalid")
  ]
};

module.exports = patientValidation;
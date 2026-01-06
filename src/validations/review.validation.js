const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const reviewValidation = {
  create: [
    body("appointmentId")
      .notEmpty().withMessage("Appointment ID is required")
      .custom(isValidObjectId).withMessage("Invalid appointment ID"),
    body("stars")
      .isInt({ min: 1, max: 5 }).withMessage("Stars must be between 1 and 5"),
    body("comment").optional().isString().isLength({ max: 500 })
  ],
  update: [
    param("id").custom(isValidObjectId).withMessage("Invalid review ID"),
    body("stars").optional().isInt({ min: 1, max: 5 }),
    body("comment").optional().isString().isLength({ max: 500 })
  ],
  getById: [
    param("id").custom(isValidObjectId).withMessage("Invalid review ID")
  ],
  delete: [
    param("id").custom(isValidObjectId).withMessage("Invalid review ID")
  ],
  getAll: [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601()
  ]
};

module.exports = reviewValidation;
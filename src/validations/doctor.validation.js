const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const doctorValidation = {
  create: [
    // Example:
    // body("title").notEmpty().withMessage("Title is required"),
  ],

  update: [
    param("id")
      .custom((value) => mongoose.Types.ObjectId.isValid(value))
      .withMessage("Invalid ID format"),

    // body("title").optional().notEmpty().withMessage("Title cannot be empty"),
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

module.exports = doctorValidation;

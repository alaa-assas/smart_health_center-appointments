const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const appointmentValidation = {
  create: [
    body("doctorId")
      .notEmpty()
      .withMessage("Doctor ID is required")
      .custom((v) => mongoose.Types.ObjectId.isValid(v))
      .withMessage("Invalid Doctor ID format"),

    body("date")
      .notEmpty()
      .withMessage("Date is required")
      .isISO8601()
      .withMessage("Invalid date format"),

    body("slot.start")
      .notEmpty()
      .withMessage("Start time is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid time format (HH:MM)"),

    body("slot.end")
      .notEmpty()
      .withMessage("End time is required")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid time format (HH:MM)")
      .custom((end, { req }) => {
        const toMinutes = (t) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };
        return toMinutes(end) - toMinutes(req.body.slot?.start) === 30;
      })
      .withMessage("Appointment duration must be exactly 30 minutes"),

    body("patientId")
      .optional()
      .custom((v) => !v || mongoose.Types.ObjectId.isValid(v))
      .withMessage("Invalid Patient ID format"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes cannot exceed 1000 characters"),

    body("symptoms")
      .optional()
      .isArray()
      .withMessage("Symptoms must be an array"),
  ],

  updateStatus: [
    param("id")
      .custom((v) => mongoose.Types.ObjectId.isValid(v))
      .withMessage("Invalid Appointment ID format"),

    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["Confirmed", "Completed", "Cancelled"])
      .withMessage("Status must be one of: Confirmed, Completed, Cancelled"),

    body("cancelReason")
      .optional()
      .custom((value, { req }) => {
        if (
          req.body.status === "Cancelled" &&
          (!value || value.trim() === "")
        ) {
          throw new Error("Cancel reason is required when status is Cancelled");
        }
        return true;
      })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Cancel reason cannot exceed 500 characters"),
  ],

  update: [
    param("id")
      .custom((v) => mongoose.Types.ObjectId.isValid(v))
      .withMessage("Invalid Appointment ID format"),

    body("date").optional().isISO8601().withMessage("Invalid date format"),

    body("slot.start")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid time format (HH:MM)"),

    body("slot.end")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid time format (HH:MM)")
      .custom((end, { req }) => {
        if (!req.body.slot?.start) return true;
        const toMinutes = (t) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };
        return toMinutes(end) - toMinutes(req.body.slot.start) === 30;
      })
      .withMessage("Appointment duration must be exactly 30 minutes"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes cannot exceed 1000 characters"),

    body("symptoms")
      .optional()
      .isArray()
      .withMessage("Symptoms must be an array"),
  ],

  getForDoctor: [
    query("date").optional().isISO8601().withMessage("Invalid date format"),

    query("status")
      .optional()
      .isIn(["Pending", "Confirmed", "Completed", "Cancelled"])
      .withMessage("Invalid status value"),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],

  getForPatient: [
    query("status")
      .optional()
      .isIn(["Pending", "Confirmed", "Completed", "Cancelled"])
      .withMessage("Invalid status value"),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],

  getById: [
    param("id")
      .custom((v) => mongoose.Types.ObjectId.isValid(v))
      .withMessage("Invalid Appointment ID format"),
  ],

  getAvailableSlots: [
    param("doctorId")
      .custom((v) => mongoose.Types.ObjectId.isValid(v))
      .withMessage("Invalid Doctor ID format"),

    query("date").optional().isISO8601().withMessage("Invalid date format"),
  ],
};

module.exports = appointmentValidation;

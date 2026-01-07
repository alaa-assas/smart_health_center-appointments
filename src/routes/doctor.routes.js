const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");

const doctorValidation = require("../validations/doctor.validation");
const DoctorController = require("../controllers/DoctorController");

/**
 * @POST /api/v1/doctors
 * Create a new doctor (Admin only)
 */
router.post("/", [doctorValidation.create, validate], DoctorController.create);

/**
 * @PUT /api/v1/doctors/:id
 * Update doctor info (Admin only)
 */
router.put(
  "/:id",
  [doctorValidation.update, validate],
  DoctorController.update
);

/**
 * @GET /api/v1/doctors/:id
 * Get doctor details + specialty, schedule, reviews
 */
router.get(
  "/:id",
  [doctorValidation.getById, validate],
  DoctorController.getById
);

/**
 * @DELETE /api/v1/doctors/:id
 * Remove doctor + delete their schedule (Admin only)
 */
router.delete(
  "/:id",
  [doctorValidation.delete, validate],
  DoctorController.delete
);

/**
 * @GET /api/v1/doctors
 * Get all doctors with search/filter options
 */
router.get("/", [doctorValidation.getAll, validate], DoctorController.getAll);

module.exports = router;

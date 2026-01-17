const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");
const asyncHandler = require("../utils/asyncHanlder");


const doctorValidation = require("../validations/doctor.validation");
const DoctorController = require("../controllers/DoctorController");
const {auhtorize, requireAuth} = require("../middlewares/auth.middleware");

/**
 * @POST /api/v1/doctors
 * Create a new doctor (Admin only)
 */
router.post(
    "/",
    [requireAuth, auhtorize("admin"), doctorValidation.create, validate],
    DoctorController.create
);

/**
 * @PUT /api/v1/doctors/:id
 * Update doctor info (Admin only)
 */
router.put(
    "/:id",
    [requireAuth, auhtorize("admin"), doctorValidation.update, validate],
    asyncHandler(DoctorController.update)
);

/**
 * @GET /api/v1/doctors/:id
 * Get doctor details + specialty, schedule, reviews
 */
router.get(
    "/:id",
    [doctorValidation.getById, validate],
    asyncHandler(DoctorController.getById)
);

/**
 * @DELETE /api/v1/doctors/:id
 * Soft delete a doctor (set isActive to false)
 */
router.delete(
    "/:id",
    [requireAuth, auhtorize("admin"), doctorValidation.delete, validate],
    asyncHandler(DoctorController.delete)
);

/**
 * @POST /api/v1/doctors/:id/restore
 * Restore a soft deleted doctor
 */
router.post(
    "/:id/restore",
    [requireAuth, auhtorize("admin"), doctorValidation.getById, validate],
    asyncHandler(DoctorController.restore)
);

/**
 * @GET /api/v1/doctors
 * Get all doctors with search/filter options
 */
router.get("/",
    [doctorValidation.getAll, validate],
    asyncHandler(DoctorController.getAll)
);

/**
 * @GET /api/v1/doctors/:id/schedule
 * Get doctor's schedule
 */
router.get(
    "/:id/schedule",
    [doctorValidation.getById, validate],
    asyncHandler(DoctorController.getSchedule)
);

module.exports = router;

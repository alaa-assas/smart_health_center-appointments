const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");
const asyncHandler = require("../utils/asyncHanlder");

const appointmentValidation = require("../validations/appointment.validation");
const appointmentController = require("../controllers/AppointmentController");
const { requireAuth, auhtorize } = require("../middlewares/auth.middleware");

// create new appoitments
router.post(
    "/",
    [
        requireAuth,
        auhtorize("patient", "admin"),
        appointmentValidation.create,
        validate,
    ],
    asyncHandler(appointmentController.create)
);

// update appointments status
router.patch(
    "/status/:id",
    [
        requireAuth,
        auhtorize("doctor", "admin"),
        appointmentValidation.updateStatus,
        validate,
    ],
    asyncHandler(appointmentController.updateStatus)
);

// update appointment
router.put(
    "/:id",
    [
        requireAuth,
        auhtorize("patient", "admin"),
        appointmentValidation.update,
        validate,
    ],
    asyncHandler(appointmentController.update)
);

// get doctor appointment
router.get(
    "/for-doctor",
    [
        requireAuth,
        auhtorize("doctor"),
        appointmentValidation.getForDoctor,
        validate,
    ],
    asyncHandler(appointmentController.getForDoctor)
);

// get patient appointment
router.get(
    "/for-patient",
    [
        requireAuth,
        auhtorize("patient"),
        appointmentValidation.getForPatient,
        validate,
    ],
    asyncHandler(appointmentController.getForPatient)
);

//  appointment details
router.get(
    "/:id",
    [
        requireAuth,
        auhtorize("patient", "doctor", "admin"),
        appointmentValidation.getById,
        validate,
    ],
    asyncHandler(appointmentController.getById)
);

//  get available appointment for a doctor
router.get(
    "/available/:doctorId",
    [
        requireAuth,
        auhtorize("patient", "doctor", "admin"),
        appointmentValidation.getAvailableSlots,
        validate,
    ],
    asyncHandler(appointmentController.getAvailableSlots)
);

module.exports = router;
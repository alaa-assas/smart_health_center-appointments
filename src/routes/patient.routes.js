const express = require("express");
const router = express.Router();

const patientController = require("../controllers/PatientController");
const patientValidation = require("../validations/patient.validation");
const validate = require("../middlewares/validate.middleware");
const asyncHandler = require("../utils/asyncHanlder");


// Routes for the general patients collection
router.route("/")
    .get(patientController.getAll)
    .post(
        [patientValidation.create, validate],
        asyncHandler(patientController.create)
    );

// Routes for specific patient entries
router.route("/:id")
    .get(
        [patientValidation.getById, validate],
        asyncHandler(patientController.getById)
    )
    .put(
        [patientValidation.update, validate],
        asyncHandler(patientController.update)
    )
    .delete(
        [patientValidation.getById, validate],
        asyncHandler(patientController.delete)
    );

module.exports = router;
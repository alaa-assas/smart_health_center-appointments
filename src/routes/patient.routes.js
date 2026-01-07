const express = require("express");
const router = express.Router();

const patientController = require("../controllers/PatientController");
const patientValidation = require("../validations/patient.validation");
const validate = require("../middlewares/validate.middleware");

// Routes for the general patients collection
router.route("/")
  .get(patientController.getAll)
  .post(
    [patientValidation.create, validate], 
    patientController.create
  );

// Routes for specific patient entries
router.route("/:id")
  .get(
    [patientValidation.getById, validate], 
    patientController.getById
  )
  .put(
    [patientValidation.update, validate], 
    patientController.update
  )
  .delete(
    [patientValidation.getById, validate], 
    patientController.delete
  );

module.exports = router;
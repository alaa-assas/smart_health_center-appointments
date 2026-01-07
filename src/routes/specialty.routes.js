
const express = require("express");
const router = express.Router();
const validate = require('../middlewares/validate.middleware');

const specialtyValidation = require("../validations/specialty.validation");

const specialtyController = require("../controllers/SpecialtyController");

/**
 * @POST /api/specialties
 * Create a new specialty
 */
router.post(
    "/",
    [
        specialtyValidation.create,
        validate
    ],
    specialtyController.create
);

/**
 * @PUT /api/specialties/:id
 * Update a specialty by ID
 */
router.put(
  "/:id",
  [
    specialtyValidation.update,
    validate
  ],
  specialtyController.update
);

/**
 * @GET /api/specialties/:id
 * Get a specialty by ID
 */
router.get(
  "/:id",
  [
    specialtyValidation.getById,
    validate
  ],
  specialtyController.getById
);

/**
 * @DELETE /api/specialties/:id
 * Delete a specialty by ID
 */
router.delete(
  "/:id",
  [
    specialtyValidation.delete,
    validate
  ],
  specialtyController.delete
);

/**
 * @GET /api/specialties
 * Get all specialties
 */
router.get("/", specialtyController.getAll); 

module.exports = router;
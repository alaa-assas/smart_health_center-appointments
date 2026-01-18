const express = require("express");
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const asyncHandler = require("../utils/asyncHanlder");
const {auhtorize, requireAuth} = require("../middlewares/auth.middleware");
const specialtyValidation = require("../validations/specialty.validation");
const specialtyController = require("../controllers/SpecialtyController");

/**
 * @POST /api/specialties
 * Create a new specialty
 */
router.post(
    "/",
    [
        requireAuth,
        auhtorize("admin"),
        specialtyValidation.create,
        validate
    ],
    asyncHandler(specialtyController.create)
);

/**
 * @PUT /api/specialties/:id
 * Update a specialty by ID
 */
router.put(
    "/:id",
    [
        requireAuth,
        auhtorize("admin"),
        specialtyValidation.update,
        validate
    ],
    asyncHandler(specialtyController.update)
);

/**
 * @GET /api/specialties/:id
 * Get a specialty by ID
 */
router.get(
    "/:id",
    [
        requireAuth,
        auhtorize("admin"),
        specialtyValidation.getById,
        validate
    ],
    asyncHandler(specialtyController.getById)
);

/**
 * @DELETE /api/specialties/:id
 * Delete a specialty by ID
 */
router.delete(
    "/:id",
    [
        requireAuth,
        auhtorize("admin"),
        specialtyValidation.delete,
        validate
    ],
    asyncHandler(specialtyController.delete)
);

/**
 * @GET /api/specialties
 * Get all specialties
 */
router.get("/", 
    [
        requireAuth,
        auhtorize("admin")
    ],
     asyncHandler(specialtyController.getAll));

module.exports = router;
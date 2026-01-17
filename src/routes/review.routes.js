const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate.middleware");
const asyncHandler = require("../utils/asyncHanlder");

const reviewValidation = require("../validations/review.validation");
const reviewController = require("../controllers/ReviewController");


/**
 * @POST /api/v1/reviews
 * Patient adds a review for a completed appointment
 */
router.post(
    "/",
    [
        reviewValidation.create,
        validate
    ],
    asyncHandler(reviewController.create)
);

/**
 * @PUT /api/v1/reviews/:id
 * Patient updates their review (stars & comment only)
 */
router.put(
    "/:id",
    [
        reviewValidation.update,
        validate
    ],
    asyncHandler(reviewController.update)
);

/**
 * @GET /api/v1/reviews
 * Get all reviews (filter by date) — Admin only
 */
router.get(
    "/",
    [
        reviewValidation.getAll,
        validate
    ],
    asyncHandler(reviewController.getAll)
);

/**
 * @GET /api/v1/reviews/:id
 * Get detailed review with patient & doctor details — Admin, Patient, Doctor
 */
router.get(
    "/:id",
    [
        reviewValidation.getById,
        validate
    ],
    asyncHandler(reviewController.getById)
);

/**
 * @DELETE /api/v1/reviews/:id
 * Patient deletes their own review
 */
router.delete(
    "/:id",
    [
        reviewValidation.delete,
        validate
    ],
    asyncHandler(reviewController.delete)
);

module.exports = router;
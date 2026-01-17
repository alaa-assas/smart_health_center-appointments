const Review = require("../models/Review");
const Appointment = require("../models/Appointment");
const collection = require("../utils/collection");
const cookieService = require("../utils/cookieService");
const tokenService = require("../utils/tokenService");

/**
 * @desc    Extract user ID from access token stored in cookies
 *
 * This helper function retrieves the access token from the request cookies,
 * verifies its validity, and returns the authenticated user's ID.
 *
 * @param   {Object} req - Express request object
 * @returns {String} userId - Authenticated user's ID extracted from the token
 *
 * @throws  {Error} If access token is missing or invalid
 */
const getUserIdFromAccessToken = (req) => {
    const accessToken = cookieService.getAccessToken(req);
    if (!accessToken) {
        throw new Error("No access token found");
    }
    const decoded = tokenService.verifyAccessToken(accessToken);
    return decoded.id;
};

class ReviewController {

    /**
     * @desc    Create a new review for a completed appointment
     * @route   POST /reviews
     * @access  Protected (Patient)
     *
     * This method allows a patient to create a review for their own
     * completed appointment. Only one review per appointment is allowed.
     */
    async create(req, res, next) {
        const {appointmentId, stars, comment} = req.body;

        // Get and verify user ID from access token in cookie
        let patientId;
        try {
            patientId = getUserIdFromAccessToken(req);
        } catch (err) {
            return res.status(401).json(collection(false, err.message || "Unauthorized", null, "ERROR"));
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment || appointment.patient.toString() !== patientId) {
            return res.status(404).json(collection(false, "Appointment not found or not owned by patient", null, "ERROR"));
        }

        if (appointment.status !== "Completed") {
            return res.status(400).json(collection(false, "Can only review completed appointments", null, "ERROR"));
        }

        const existingReview = await Review.findOne({appointmentId});
        if (existingReview) {
            return res.status(400).json(collection(false, "Review already exists for this appointment", null, "ERROR"));
        }

        const review = new Review({
            appointmentId,
            stars,
            comment,
        });

        await review.save();
        return res.status(201).json(collection(true, "Review created successfully", review, "SUCCESS"));

    }

    /**
     * @desc    Update an existing review
     * @route   PUT /reviews/:id
     * @access  Protected (Patient - Owner only)
     *
     * This method allows a patient to update their own review.
     */
    async update(req, res, next) {
        const {id} = req.params;
        const {stars, comment} = req.body;

        let patientId;
        try {
            patientId = getUserIdFromAccessToken(req);
        } catch (err) {
            return res.status(401).json(collection(false, err.message || "Unauthorized", null, "ERROR"));
        }

        const review = await Review.findById(id).populate("appointmentId");
        if (!review) {
            return res.status(404).json(collection(false, "Review not found", null, "ERROR"));
        }

        if (review.appointmentId?.patient?.toString() !== patientId) {
            return res.status(403).json(collection(false, "Not authorized to update this review", null, "ERROR"));
        }

        review.stars = stars ?? review.stars;
        review.comment = comment ?? review.comment;

        await review.save();
        return res.json(collection(true, "Review updated successfully", review, "SUCCESS"));
    }

    /**
     * @desc    Retrieve all reviews (with optional date filtering)
     * @route   GET /reviews
     * @access  Protected (Admin only)
     *
     * This method allows admins to retrieve all reviews,
     * optionally filtered by creation date.
     */
    async getAll(req, res, next) {
        let userId, isAdmin = false;
        try {
            const decoded = tokenService.verifyAccessToken(cookieService.getAccessToken(req));
            userId = decoded.id;
            isAdmin = decoded.role === "admin";
        } catch (err) {
            return res.status(401).json(collection(false, "Admin access required", null, "ERROR"));
        }

        if (!isAdmin) {
            return res.status(403).json(collection(false, "Forbidden: Admins only", null, "ERROR"));
        }

        const {startDate, endDate} = req.query;
        let filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const reviews = await Review.find(filter)
            .populate("appointmentId", "patient doctor")
            .populate("appointmentId.patient", "name email")
            .populate("appointmentId.doctor", "name specialty")
            .sort({createdAt: -1});

        return res.json(collection(true, "Reviews retrieved successfully", reviews, "SUCCESS"));
    }

    /**
     * @desc    Get a single review by ID
     * @route   GET /reviews/:id
     * @access  Protected (Patient / Doctor / Admin)
     *
     * This method allows access to a review only if the requester
     * is the related patient, doctor, or an admin.
     */
    async getById(req, res, next) {
        const {id} = req.params;

        let userId;
        try {
            userId = getUserIdFromAccessToken(req);
        } catch (err) {
            return res.status(401).json(collection(false, "Unauthorized", null, "ERROR"));
        }

        const review = await Review.findById(id).populate({
            path: "appointmentId",
            populate: [
                {path: "patient", select: "name email"},
                {path: "doctor", select: "name specialty"},
            ],
        });

        if (!review) {
            return res.status(404).json(collection(false, "Review not found", null, "ERROR"));
        }

        const appointment = review.appointmentId;
        const isPatient = appointment.patient._id.toString() === userId;
        const isDoctor = appointment.doctor._id.toString() === userId;

        // Also check if user is admin (if role is in token)
        let isAdmin = false;
        try {
            const decoded = tokenService.verifyAccessToken(cookieService.getAccessToken(req));
            isAdmin = decoded.role === "admin";
        } catch (e) {

        }

        if (!isAdmin && !isPatient && !isDoctor) {
            return res.status(403).json(collection(false, "Access denied", null, "ERROR"));
        }

        return res.json(collection(true, "Review retrieved successfully", review, "SUCCESS"));
    }

    /**
     * @desc    Delete a review
     * @route   DELETE /reviews/:id
     * @access  Protected (Patient - Owner only)
     *
     * This method allows a patient to delete their own review.
     */
    async delete(req, res, next) {
        const {id} = req.params;

        let patientId;
        try {
            patientId = getUserIdFromAccessToken(req);
        } catch (err) {
            return res.status(401).json(collection(false, "Unauthorized", null, "ERROR"));
        }

        const review = await Review.findById(id).populate("appointmentId");
        if (!review) {
            return res.status(404).json(collection(false, "Review not found", null, "ERROR"));
        }

        if (review.appointmentId?.patient?.toString() !== patientId) {
            return res.status(403).json(collection(false, "Not authorized to delete this review", null, "ERROR"));
        }

        await Review.findByIdAndDelete(id);
        return res.json(collection(true, "Review deleted successfully", null, "SUCCESS"));
    }
}

module.exports = new ReviewController();
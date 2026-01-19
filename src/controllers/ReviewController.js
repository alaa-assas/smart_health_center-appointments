const Review = require("../models/Review");
const Patient = require("../models/Patient"); 
const Appointment = require("../models/Appointment");
const collection = require("../utils/collection");

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
        const userId = req.user.id; 

        const patientRecord = await Patient.findOne({ userId });
        if (!patientRecord) {
            return res.status(404).json(collection(false, "Patient profile not found", null, "ERROR"));
        }

        const patientId = patientRecord._id;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment || !appointment.patientId.equals(patientId)) {
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
        const patientId = req.user.id; 

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

        if (req.user.role !== "admin") {
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
            .populate("appointmentId.patient", "fullName email")
            .populate("appointmentId.doctor", "fullName specialty")
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
        const userId = req.user.id;
        const userRole = req.user.role; 

        const review = await Review.findById(id).populate({
            path: "appointmentId",
            populate: [
                {path: "patient", select: "fullName email"},
                {path: "doctor", select: "fullName specialty"},
            ],
        });

        if (!review) {
            return res.status(404).json(collection(false, "Review not found", null, "ERROR"));
        }

        const appointment = review.appointmentId;
        const isPatient = appointment.patient._id.toString() === userId;
        const isDoctor = appointment.doctor._id.toString() === userId;
        const isAdmin = userRole === "admin"; 

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
        const patientId = req.user.id; 

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
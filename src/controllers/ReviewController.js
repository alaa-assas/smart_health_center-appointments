const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

class ReviewController {
  // POST /api/v1/reviews — Patient adds a review for a completed appointment
  async create(req, res) {
    try {
      const { appointmentId, stars, comment } = req.body;
      const patientId = req.user.id;

      const appointment = await Appointment.findById(appointmentId);
      if (!appointment || appointment.patient.toString() !== patientId) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found or not owned by patient",
        });
      }

      if (appointment.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Can only review completed appointments",
        });
      }

      const existingReview = await Review.findOne({ appointmentId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "Review already exists for this appointment",
        });
      }

      const review = new Review({
        appointmentId,
        stars,
        comment,
      });

      await review.save();
      return res.status(201).json({ success: true, data: review });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // PUT /api/v1/reviews/:id — Patient updates their review (stars & comment only)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { stars, comment } = req.body;
      const patientId = req.user.id;

      const review = await Review.findById(id).populate("appointmentId");
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (review.appointmentId?.patient?.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this review",
        });
      }

      review.stars = stars ?? review.stars;
      review.comment = comment ?? review.comment;

      await review.save();
      return res.json({ success: true, data: review });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // GET /api/v1/reviews — Get all reviews (filter by date) — Admin only
  async getAll(req, res) {
    try {
      const { startDate, endDate } = req.query;

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
        .sort({ createdAt: -1 });

      return res.json({ success: true, data: reviews });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // GET /api/v1/reviews/:id — Get detailed review — Admin, Patient, Doctor
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const review = await Review.findById(id).populate({
        path: "appointmentId",
        populate: [
          { path: "patient", select: "name email" },
          { path: "doctor", select: "name specialty" },
        ],
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      const appointment = review.appointmentId;
      const isPatient = appointment.patient._id.toString() === user.id;
      const isDoctor = appointment.doctor._id.toString() === user.id;
      const isAdmin = user.role === "admin";

      if (!isAdmin && !isPatient && !isDoctor) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      return res.json({ success: true, data: review });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // DELETE /api/v1/reviews/:id — Patient deletes their own review
  async delete(req, res) {
    try {
      const { id } = req.params;
      const patientId = req.user.id;

      const review = await Review.findById(id).populate("appointmentId");
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      if (review.appointmentId?.patient?.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this review",
        });
      }

      await Review.findByIdAndDelete(id);
      return res.json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

module.exports = new ReviewController();
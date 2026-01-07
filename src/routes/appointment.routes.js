import express from "express";
import {
  createAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  cancelAppointment
} from "../controllers/appointment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// 1️⃣ Create appointment
router.post("/", createAppointment);

// 2️⃣ Get my appointments
router.get("/", getMyAppointments);

// 3️⃣ Update appointment status
router.patch("/:id/status", updateAppointmentStatus);

// 4️⃣ Cancel appointment
router.patch("/:id/cancel", cancelAppointment);

export default router;

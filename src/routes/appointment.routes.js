import express from "express";

const AppointmentController = require("../controllers/AppointmentController")
const {requireAuth} = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHanlder");


const router = express.Router();

router.use(requireAuth);

// 1️⃣ Create appointment
router.post("/", asyncHandler(AppointmentController.createAppointment));

// 2️⃣ Get my appointments
router.get("/", asyncHandler(AppointmentController.getMyAppointments));

// 3️⃣ Update appointment status
router.patch("/:id/status", asyncHandler(AppointmentController.updateAppointmentStatus));

// 4️⃣ Cancel appointment
router.patch("/:id/cancel", asyncHandler(AppointmentController.cancelAppointment));

export default router;

const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/ReportController");
const {requireAuth, auhtorize} = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHanlder");


// All routes here require Authentication and Admin role
router.use(requireAuth);
router.use(auhtorize("admin"));

router.get("/appointments", asyncHandler(ReportController.getAppointmentsReport));
router.get("/summary", asyncHandler(ReportController.getSummaryReport));
router.get("/audit-logs", asyncHandler(ReportController.getAuditLogsReport));
router.get("/export", asyncHandler(ReportController.exportReport));

module.exports = router;
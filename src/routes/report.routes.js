const express = require("express");
const router = express.Router();
const { 
    getAppointmentsReport, 
    getSummaryReport, 
    getAuditLogsReport 
} = require("../controllers/report.controller");
const { requireAuth, auhtorize } = require("../middlewares/auth.middleware");

// All routes here require Authentication and Admin role
router.use(requireAuth);
router.use(auhtorize("ADMIN"));

router.get("/appointments", getAppointmentsReport);
router.get("/summary", getSummaryReport);
router.get("/audit-logs", getAuditLogsReport);
router.get("/export", exportReport);

module.exports = router;
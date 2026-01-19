const Appointment = require("../models/Appointment");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHanlder");
const ExportService = require("../services/export.service");
const collection = require("../utils/collection");
const mongoose = require("mongoose");

class ReportController {

    /**
     *
     * @description
     * Helper function responsible for recording reporting-related actions
     * into the AuditLog collection.
     *
     * This function is used to track administrative interactions with
     * reports such as:
     * - Viewing reports
     * - Exporting reports
     * - Generating summaries
     *
     * Reports are considered **virtual entities**, therefore:
     * - entityId is always set to null
     *
     * The `details` parameter allows storing additional contextual
     * information related to the report action (e.g. report type,
     * filters applied, export format).
     *
     * @param {ObjectId} userId   - The ID of the user performing the action
     * @param {String} action    - The action identifier (e.g. REPORT_VIEW, REPORT_EXPORT)
     * @param {any} details      - Optional metadata or description for the action
     *
     * @returns {Promise<void>}
     *
     * @example
     * await logReportAction(
     *   req.user.id,
     *   "REPORT_EXPORT",
     *   { format: "xlsx", dateRange: "2024-01-01 → 2024-01-31" }
     * );
     */

    logReportAction = async (userId, action, details) => {
        await AuditLog.create({
            userId,
            action,
            entity: "Report",
            entityId: null,
            details
        });
    };

    /**
     * @function getAppointmentsReport
     *
     * @description
     * Generates a detailed, paginated appointments report for admin users.
     * The report supports multiple optional filters and joins data from
     * related collections to provide a complete view of each appointment.
     *
     * Supported filters:
     * - Date range (from / to)
     * - Doctor ID
     * - Specialty ID
     * - Appointment status
     *
     * The report aggregates data from:
     * - Appointments
     * - Doctors
     * - Patients
     * - Users
     * - Specialties
     *
     * MongoDB Aggregation Pipeline is used with:
     * - $match for dynamic filtering
     * - $lookup for joining related collections
     * - $project for shaping the final response
     * - $facet for pagination and total count in a single query
     *
     * @route   GET /api/v1/admin/reports/appointments
     * @access  Private/Admin
     *
     * @query
     * @param {String}  [from]         - Start date (ISO string)
     * @param {String}  [to]           - End date (ISO string)
     * @param {String}  [doctorId]     - Doctor ObjectId
     * @param {String}  [specialtyId]  - Specialty ObjectId
     * @param {String}  [status]       - Appointment status
     * @param {Number}  [page=1]       - Page number for pagination
     * @param {Number}  [limit=10]     - Number of records per page
     *
     * @returns {Object} Standard API response containing:
     * - pagination metadata (page, limit, total)
     * - array of appointment report records
     *
     * @example
     * GET /api/v1/admin/reports/appointments?from=2024-01-01&to=2024-01-31&status=Completed
     */
    getAppointmentsReport = asyncHandler(async (req, res) => {
        const { from, to, doctorId, specialtyId, status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const matchStage = {};
        if (from || to) {
            matchStage.date = {};
            if (from) matchStage.date.$gte = new Date(from);
            if (to) matchStage.date.$lte = new Date(to);
        }
        if (doctorId) matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
        if (status) matchStage.status = status;

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctorInfo"
                }
            },
            { $unwind: "$doctorInfo" },
            {
                $lookup: {
                    from: "users",
                    localField: "doctorInfo.userId",
                    foreignField: "_id",
                    as: "doctorUserDetails"
                }
            },
            { $unwind: "$doctorUserDetails" },
            {
                $lookup: {
                    from: "specialties",
                    localField: "doctorInfo.specialtyId",
                    foreignField: "_id",
                    as: "specialtyInfo"
                }
            },
            { $unwind: "$specialtyInfo" },
            ...(specialtyId
                ? [{ $match: { "specialtyInfo._id": new mongoose.Types.ObjectId(specialtyId) } }]
                : []),
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patientInfo"
                }
            },
            { $unwind: "$patientInfo" },
            {
                $lookup: {
                    from: "users",
                    localField: "patientInfo.userId",
                    foreignField: "_id",
                    as: "patientUserDetails"
                }
            },
            { $unwind: "$patientUserDetails" },
            {
                $project: {
                    _id: 1,
                    date: 1,
                    slot: 1,
                    status: 1,
                    cancelReason: 1,
                    patientName: "$patientUserDetails.name",
                    doctorName: "$doctorUserDetails.name",
                    specialty: "$specialtyInfo.name",
                    createdAt: 1
                }
            },
            { $sort: { date: -1 } },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: parseInt(limit) }]
                }
            }
        ];

        const result = await Appointment.aggregate(pipeline);
        const total = result[0].metadata[0]?.total || 0;

        await this.logReportAction(req.user.id, "REPORT_VIEW", "Appointment List");

        return res.status(200).json(
            collection(
                true,
                "Appointments report fetched successfully",
                {
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total
                    },
                    data: result[0].data
                },
                "SUCCESS"
            )
        );
    });

    /**
     *
     * @description
     * Generates high-level summary statistics for the admin dashboard.
     * This report provides an aggregated overview of appointments,
     * useful for analytics and monitoring system activity.
     *
     * Included statistics:
     * - Total number of appointments grouped by status
     * - Total number of appointments grouped by medical specialty
     *
     * The data is generated using MongoDB aggregation pipelines
     * with grouping and collection lookups.
     *
     * An audit log entry is recorded to track report access.
     *
     * @route   GET /api/v1/admin/reports/summary
     * @access  Private/Admin
     *
     * @returns {Object} Standard API response containing:
     * - appointmentsByStatus: Object keyed by appointment status
     * - appointmentsBySpecialty: Array of specialties with counts
     *
     * @example
     * GET /api/v1/admin/reports/summary
     */

    getSummaryReport = asyncHandler(async (req, res) => {
        const statusStats = await Appointment.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const specialtyStats = await Appointment.aggregate([
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },
            {
                $lookup: {
                    from: "specialties",
                    localField: "doctor.specialtyId",
                    foreignField: "_id",
                    as: "specialty"
                }
            },
            { $unwind: "$specialty" },
            { $group: { _id: "$specialty.name", count: { $sum: 1 } } }
        ]);

        await this.logReportAction(req.user.id, "REPORT_VIEW", "Summary Statistics");

        return res.status(200).json(
            collection(
                true,
                "Summary report fetched successfully",
                {
                    appointmentsByStatus: statusStats.reduce(
                        (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
                        {}
                    ),
                    appointmentsBySpecialty: specialtyStats.map(s => ({
                        name: s._id,
                        count: s.count
                    }))
                },
                "SUCCESS"
            )
        );
    });

    /**
     * @description
     * Retrieves a list of recent audit log entries for administrative review.
     * This report is intended for monitoring system activity, security events,
     * and administrative actions across the platform.
     *
     * Each audit log entry includes:
     * - User information (name, email, role)
     * - Action performed
     * - Target entity and entity ID (if applicable)
     * - Timestamp of the action
     *
     * The logs are:
     * - Sorted by most recent first
     * - Limited to the latest 100 records for performance and clarity
     *
     * @route   GET /api/v1/admin/reports/audit-logs
     * @access  Private/Admin
     *
     * @returns {Object} Standard API response containing an array of audit logs
     *
     * @example
     * GET /api/v1/admin/reports/audit-logs
     */

    getAuditLogsReport = asyncHandler(async (req, res) => {
        const logs = await AuditLog.find()
            .populate("userId", "name email role")
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json(
            collection(
                true,
                "Audit logs fetched successfully",
                logs,
                "SUCCESS"
            )
        );
    });

    /**
     * @description
     * Exports appointment report data in either Excel (XLSX) or PDF format
     * for administrative users.
     *
     * The exported report supports advanced filtering options similar to
     * the appointments report, allowing administrators to export
     * customized datasets.
     *
     * Workflow:
     * 1. Validate requested export format
     * 2. Build dynamic filter object based on query parameters
     * 3. Aggregate and enrich appointment data using MongoDB pipelines
     * 4. Log the export action to AuditLog
     * 5. Generate and stream the file to the client
     *
     * @route   GET /api/v1/admin/reports/export
     * @access  Private/Admin
     *
     * @query
     * @param {String} format        - Export format ("xlsx" | "pdf")
     * @param {String} [from]        - Start date (ISO format)
     * @param {String} [to]          - End date (ISO format)
     * @param {String} [doctorId]    - Doctor ObjectId
     * @param {String} [specialtyId]- Specialty ObjectId
     * @param {String} [status]      - Appointment status
     *
     * @returns {File} Downloadable Excel or PDF report
     *
     * @example
     * GET /api/v1/admin/reports/export?format=xlsx&status=Completed
     */
    exportReport = asyncHandler(async (req, res) => {
        const { format, from, to, doctorId, specialtyId, status } = req.query;

        if (!["xlsx", "pdf"].includes(format)) {
            return res.status(400).json(
                collection(
                    false,
                    "Invalid format. Use 'xlsx' or 'pdf'.",
                    null,
                    "VALIDATION_ERROR"
                )
            );
        }

        const matchStage = {};
        if (from || to) {
            matchStage.date = {};
            if (from) matchStage.date.$gte = new Date(from);
            if (to) matchStage.date.$lte = new Date(to);
        }
        if (doctorId) matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
        if (status) matchStage.status = status;

        const reportData = await Appointment.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            { $unwind: "$doctor" },
            {
                $lookup: {
                    from: "specialties",
                    localField: "doctor.specialtyId",
                    foreignField: "_id",
                    as: "specialty"
                }
            },
            { $unwind: "$specialty" },
            ...(specialtyId
                ? [{ $match: { "specialty._id": new mongoose.Types.ObjectId(specialtyId) } }]
                : []),
            {
                $lookup: {
                    from: "users",
                    localField: "doctor.userId",
                    foreignField: "_id",
                    as: "doctorUser"
                }
            },
            { $unwind: "$doctorUser" },
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patient"
                }
            },
            { $unwind: "$patient" },
            {
                $lookup: {
                    from: "users",
                    localField: "patient.userId",
                    foreignField: "_id",
                    as: "patientUser"
                }
            },
            { $unwind: "$patientUser" },
            {
                $project: {
                    _id: 0,
                    patientName: "$patientUser.fullName",
                    doctorName: "$doctorUser.fullName",
                    specialty: "$specialty.name",
                    startAt: "$slot.start",
                    endAt: "$slot.end",
                    status: 1,
                    createdAt: 1,
                    cancellationReason: "$cancelReason"
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        await this.logReportAction(
            req.user.id,
            "REPORT_EXPORT",
            `Export format: ${format}`
        );

        const fileName = `Appointment_Report_${Date.now()}`;

        if (format === "xlsx") {
            const buffer = await ExportService.toExcel(reportData, "Appointments");
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=${fileName}.xlsx`
            );
            return res.send(buffer);
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${fileName}.pdf`
        );
        return ExportService.toPDF(reportData, "Appointment Report", res);
    });
}

module.exports = new ReportController();
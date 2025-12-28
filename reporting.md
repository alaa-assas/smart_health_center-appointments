# Reporting & Analytics

This document defines the reporting and analytics features available to system administrators.

---

## 1. Reporting Goals
- Provide visibility into system usage.
- Support administrative decision-making.
- Enable filtering and exporting of appointment data.

---

## 2. Appointment Reports

### 2.1 Appointment List Report
Allows the admin to view and filter appointments.

#### Filters
- Date range (from / to)
- Doctor
- Specialty
- Appointment status

#### Returned Data
- Patient name
- Doctor name
- Specialty
- Appointment start/end time
- Status
- Creation date
- Cancellation reason (if applicable)

---

### 2.2 API Endpoint: GET /api/admin/reports/appointments

Query Parameters:
- from
- to
- doctorId
- specialtyId
- status

---

## 3. Summary & Statistics Reports

### 3.1 Summary Metrics
- Total appointments per status
- Appointments per doctor
- Appointments per specialty

---

### 3.2 API Endpoint: GET /api/admin/reports/summary

## 4. Data Aggregation Strategy
- Use MongoDB aggregation pipelines:
  - $match for filters
  - $group for counts
  - $sort for ranking
- Index fields:
  - startAt
  - doctorId
  - specialtyId
  - status

---

## 5. Exporting Reports (Optional Advanced Feature)

### 5.1 Export Formats
- Excel (.xlsx) using exceljs
- PDF using *pdfkit* or *puppeteer*

---

### 5.2 Export Endpoint: GET /api/admin/reports/export


Query Parameters:
- format (xlsx | pdf)
- from
- to
- doctorId
- specialtyId
- status

---

### 5.3 Audit Logging

- Every report view or export action is logged.
- Logged action: REPORT_VIEW, REPORT_EXPORT

---

## 6. Access Control

- Only ADMIN users can access reporting endpoints.
- Protected using RBAC middleware.

---

## 7. Performance Considerations
- Use pagination for large datasets.
- Limit export size if needed.
- Cache summary reports if system load increases.
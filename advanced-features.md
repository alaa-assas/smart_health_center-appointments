# Advanced Features Planning

Smart Health Center Appointment Booking System

---

## 1. Notifications & Reminders

### 1.1 Purpose

- Inform patients and doctors about appointment-related events.
- Reduce missed appointments through reminders.
- Provide real-time and asynchronous communication.

---

### 1.2 Notification Channels

1. **In-App Notifications (Mandatory)**

   - Stored in the database.
   - Displayed inside the application UI.

2. **Email Notifications (Should Have)**

   - Sent using Nodemailer (or SendGrid).
   - Used for confirmations, cancellations, and reminders.

3. **Real-Time Notifications (Optional)**
   - Implemented using Socket.io.
   - Delivered instantly if the user is online.

---

### 1.3 Notification Events

| Event                   | Description                       | Recipients                  |
| ----------------------- | --------------------------------- | --------------------------- |
| Appointment Created     | Patient books appointment         | Doctor (+ Patient optional) |
| Appointment Confirmed   | Doctor/Admin confirms             | Patient + Doctor            |
| Appointment Cancelled   | Appointment cancelled with reason | Patient + Doctor            |
| Appointment Rescheduled | Time/date modified                | Patient + Doctor            |
| Reminder (24h)          | 24 hours before appointment       | Patient + Doctor            |
| Reminder (1h)           | 1 hour before appointment         | Patient + Doctor            |

---

### 1.4 Notification Data Model

- userId
- type (APPT_CONFIRMED, APPT_CANCELLED, REMINDER_24H, etc.)
- title
- message
- channels (IN_APP, EMAIL, SOCKET)
- isRead
- createdAt

---

### 1.5 Implementation Strategy

- A centralized `NotificationService` handles all notifications.
- All notifications are saved in the database.
- Email and Socket notifications are optional layers.
- Failures in email/socket must not affect core booking flow.

---

### 1.6 Reminder Scheduling

- Background job using `node-cron`.
- Runs periodically (every 10–15 minutes).
- Sends reminders only once using flags:
  - reminder24Sent
  - reminder1Sent

---

## 2. Audit Logs (System Activity Tracking)

### 2.1 Purpose

- Track important system actions.
- Provide transparency and accountability.
- Support admin investigation and compliance needs.

---

### 2.2 Logged Actions

- Authentication:
  - LOGIN_SUCCESS
  - LOGIN_FAILED (optional)
- Appointments:
  - CREATE, CONFIRM, CANCEL, COMPLETE, RESCHEDULE
- Doctor Schedule:
  - UPDATE
- Specialties:
  - CREATE, UPDATE, DEACTIVATE
- Users (Admin):
  - CREATE, BLOCK, ACTIVATE
- Ratings:
  - CREATE, DELETE
- Reports:
  - VIEW, EXPORT

---

### 2.3 Audit Log Data Model

- actorUserId
- actorRole
- action
- entityType
- entityId
- metadata (before/after values, reasons, filters)
- ip (optional)
- userAgent (optional)
- createdAt

---

### 2.4 Implementation

- Use a centralized `AuditService`.
- Logs are created only after successful operations.
- Admin-only access to logs with pagination and filters.

---

## 3. Centralized Error Handling

### 3.1 Goals

- Provide consistent API error responses.
- Avoid leaking sensitive system details.
- Improve debugging and maintainability.

---

### 3.2 Covered Errors

- Validation errors
- Authentication & authorization errors
- Not found errors
- Database and server errors

---

### 3.3 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid appointment time"
  }
}
```

---

## 4. Security Enhancements

### 4.1 Input Validation

- Validate all request data using Joi or express-validator.
- Validate dates, roles, IDs, and appointment times.

### 4.2 HTTP & API Security

- Helmet for secure HTTP headers.
- CORS with restricted origins.
- Rate limiting on login endpoints.

### 4.3 Business Rules Protection

- Prevent appointment overlap.
- Enforce role-based access (RBAC).
- Ensure users access only their own data.

---

### 5. Real-Time System (Optional)

## 5.1 Purpose

Provide instant feedback for appointment changes.
Improve user experience for active users.

### 5.2 Socket Events

- notification:new
- appointment:updated
- appointment:cancelled

### 5.3 Socket Authentication

- JWT-based authentication during socket connection.
- Each socket linked to a specific userId.

---

## 6. Advanced Appointment Logic

### 6.1 Availability Calculation

- Available slots are computed from:
- Doctor weekly schedule
- Minus vacation days
- Minus existing appointments

### 6.2 Status Lifecycle Enforcement

- Allowed transitions:
- Pending → Confirmed / Cancelled
- Confirmed → Completed / Cancelled
- Completed → No changes allowed
- Cancelled → No changes allowed

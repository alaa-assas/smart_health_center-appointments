
## ✅ **DataBase Models**

### 1. **Specialty Schema**

- `name`: String, required, unique  
- `description`: String, optinal  
- `timestamps (createdAt, updatedAt)`: Date  

---

### 2. **Doctor Schema**

- `userId`: ObjectId, reference to `User`  
- `specialtyId`: ObjectId, reference to `Specialty`  
- `bio`: String  
- `avgRating`: Number, default: 0, It is calculated from reviews. 
- `yearsOfExperience`: Number, default: 0
- `certifications`: [String]
- `graduationYear`: Number
- `medicalSchool`: String
- `timestamps (createdAt, updatedAt)`: Date   

---

### 3. **Patient Schema**

- `userId`: ObjectId, reference to `User`  
- `gender`: String (enum: "male", "female", "other")  
- `chronicConditions`: [String]  
- `isActive`: Boolean, default: true  
- `timestamps (createdAt, updatedAt)`: Date  

---

### 4. **Appointment Schema**

- `patientId`: ObjectId, reference to `Patient`  
- `doctorId`: ObjectId, reference to `Doctor`  
- `date`: Date  
- `slot`: { start: String, end: String }  
- `status`: String (enum: "Pending", "Confirmed", "Completed", "Cancelled"), default: "Pending"  
- `cancelReason`: String  
- `canceldeBy`: ObjectId, reference to `User`  
- `timestamps (createdAt, updatedAt)`: Date  

---

### 5. **Review Schema**

- `appointmentId`: ObjectId, reference to `Appointment`  
- `stars`: Number, min: 1, max: 5  
- `comment`: String, optinal  
- `timestamps (createdAt, updatedAt)`: Date 

---

### 6. **DoctorSchedule Schema**

- `doctorId`: ObjectId, reference to `Doctor`, unique  
- `workDays`: [Number] (0 = Sunday, 6 = Saturday)  
- `slots`: [{ start: String, end: String }]  
- `vacations`: [{ from: Date, to: Date }]  
- `timestamps (createdAt, updatedAt)`: Date   

---

### 7. **User Schema**

- `email`: String, required, unique, lowercase  
- `passwordHash`: String, required  
- `fullName`: String  
- `phone`: String  
- `dateOfBirth`: Date  
- `address`: String  
- `role`: String (enum: "patient", "doctor", "admin"), required  
- `isActive`: Boolean, default: true  
- `timestamps (createdAt, updatedAt)`: Date  

---

### 8. **Notification Schema**

- `userId`: ObjectId, reference to `User`  
- `message`: String  
- `type`: String (enum: BOOKED_APPOINTMENT", "CONFIRMED", "CANCELLED"), required  
- `isRead`: Boolean, default: false  
- `timestamps (createdAt, updatedAt)`: Date 
 

---

### 9. **AuditLog Schema**

- `userId`: ObjectId, reference to `User`  
- `action`: String (e.g., "BOOKED_APPOINTMENT", "CONFIRMED", "CANCELLED")  
- `entity`: String (e.g., "Appointment", "Doctor")  
- `entityId`: ObjectId  
- `timestamps (createdAt, updatedAt)`: Date 

---

## 🔗 **Relationships Between Tables**

| Table | Link | Description |
|------|------|-------------|
| `Patient` | `userId` → `User._id` | Each patient has a user account |
| `Doctor` | `userId` → `User._id` | Each doctor has a user account |
| `Doctor` | `specialtyId` → `Specialty._id` | Doctor belongs to one specialty |
| `Appointment` | `patientId` → `Patient._id` | Appointment belongs to a specific patient |
| `Appointment` | `doctorId` → `Doctor._id` | Appointment belongs to a specific doctor |
| `Review` | `appointmentId` → `Appointment._id` | Review is linked to a specific appointment |
| `DoctorSchedule` | `doctorId` → `Doctor._id` | Each doctor has one schedule |

---

## API EndPoint

> `HTTP Method /endpoint | Description | Auth | Role`
---

### 📡 **Authentication & Users**

```
POST /api/v1/auth/register | Create a user account (automatically assigned role: Patient) | No | Patient
POST /api/v1/auth/login | Log in with email and password | No | None
POST /api/v1/auth/logout | Log out the current user | Yes | None
POST /api/v1/auth/refresh-token | Refresh JWT tokens | Yes | None
GET /api/v1/auth/profile | View logged-in user profile (doctor includes specialty & schedule) | Yes | None
PUT /api/v1/auth/profile | Update user profile (doctor can edit schedules) | Yes | None
```

---

### 🩺 **Specialties Operations**

```
POST /api/v1/specialties | Admin adds a new medical specialty | Yes | Admin
PUT /api/v1/specialties/:id | Update an existing specialty | Yes | Admin
GET /api/v1/specialties | Get all specialties | Yes | Admin
GET /api/v1/specialties/:id | Get details of a specific specialty | Yes | Admin
DELETE /api/v1/specialties/:id | Remove a specialty from the system | Yes | Admin
```

---

### 👨‍⚕️ **Doctor & Schedule Operations**

```
POST /api/v1/doctors | Admin adds a doctor + their schedule | Yes | Admin
PUT /api/v1/doctors/:id | Update doctor info & schedule | Yes | Admin
GET /api/v1/doctors | Get all doctors with search/filter options (name, specialty, location) | No | None
GET /api/v1/doctors/:id | Get doctor details + specialty, schedule, reviews | No | None
DELETE /api/v1/doctors/:id | Remove doctor + delete their schedule | Yes | Admin
```

---

### 📅 **Appointment Operations**

```
POST /api/v1/appointments | Patient books an appointment with a doctor | Yes | Patient, Admin
PATCH /api/v1/appointments/status/:id | Doctor updates appointment status (confirmed, canceled, completed) | Yes | Doctor, Admin
PUT /api/v1/appointments/:id | Patient modifies appointment details | Yes | Patient
GET /api/v1/appointments/for-doctor | Get appointments for logged-in doctor (filter by date) | Yes | Doctor
GET /api/v1/appointments/for-patient | Get appointments for logged-in patient (filter by status) | Yes | Patient
GET /api/v1/appointments/:id | Get details of a specific appointment | Yes | Patient, Doctor, Admin
GET /api/v1/appointments/available/:doctorId | Get available slots for a doctor on a given date | Yes | Patient, Doctor, Admin
```

---

### ⭐ **Review Operations**

```
POST /api/v1/reviews | Patient adds a review for a completed appointment | Yes | Patient
PUT /api/v1/reviews/:id | Patient updates their review (stars & comment only) | Yes | Patient
GET /api/v1/reviews/ | Get all reviews (filter by date) | Yes | Admin
GET /api/v1/reviews/:id | Get detailed review with patient & doctor details | Yes | Admin, Patient, Doctor
DELETE /api/v1/reviews/:id | Patient deletes their own review | Yes | Patient
```

---

### 📊 **Reports**

```
GET /api/v1/reports/logins | Export login reports (filtered by date) | Yes | Admin
GET /api/v1/reports/appointment | Export appointment reports (filtered by date) | Yes | Admin
GET /api/v1/reports/appointment-status | Report on booking confirmations/cancellations (filter by date/status) | Yes | Admin
```

### 👥 **Roles & Permissions (RBAC)**

| Role | Permissions |
|------|-------------|
| **Patient** | Register, Login, View Doctors, Book Appointments, Cancel Appointments, Rate Doctors |
| **Doctor** | View Appointments, Confirm/CANCEL Appointments (with reason), Edit Profile, Manage Schedule |
| **Admin** | Full access: CRUD on Users, Doctors, Specialties, Appointments, Reports, Audit Logs |
---

## Project Structure
```bash
smart_health_center-appointments/
├── node_modules/             # Installed npm dependencies (auto-generated; never commit)
├── src/                      # Main source code directory
│   ├── app.js                    # Main application entry point: sets up server, middleware, and routes
│   ├── config/                   # Configuration files (database connection, app settings, etc.)
│   ├── controllers/              # Request handlers that contain route-specific logic
│   ├── middlewares/              # Custom middleware (e.g., authentication, request logging, error handling)
│   ├── models/                   # Database models (define data schemas and business rules)
│   ├── plugins/                  # Custom or third-party plugin integrations
│   ├── routes/                   # API route definitions (maps HTTP requests to controllers)
│   ├── scripts/                  # Utility scripts (e.g., DB seeding, data migration)
│   ├── services/                 # Business logic layer, decoupled from HTTP concerns
│   ├── sockets/                  # WebSocket/real-time communication handlers (if applicable)
│   ├── test/                     # Unit and integration tests
│   ├── utils/                    # Reusable helper functions and utilities
│   └── validations/              # Input validation schemas (e.g., using Joi or Zod)                      
├── templates/                # Used to store template files generated by plop.js when scaffolding server-side
├── uploads/                  # Stores user-uploaded files (e.g., profile images, documents)
├── package.json              # Project metadata, dependencies, and npm scripts
├── package-lock.json         # Locks dependency versions for consistent installs
├── plopfile.js               # Plop.js configuration for scaffolding files (e.g., controllers, models)
├── .env                      # Environment variables (e.g., DB credentials, API keys)
├── .gitignore                # Specifies files/folders Git should ignore (e.g., node_modules, .env)
└── README.md                 # This documentation file 
```
## 📦 **Libraries Used**

| Library | Purpose |
|-------|--------|
| `express` | Web framework for Node.js to build APIs and web applications |
| `mongoose` | ODM (Object Data Modeling) library for MongoDB and Node.js |
| `jsonwebtoken` | Library for creating and verifying JSON Web Tokens (JWT) for authentication |
| `argon2` | Password hashing library using the Argon2 algorithm for secure password storage |
| `express-validator` | Set of middleware for validating and sanitizing user input data |
| `helmet` | Security middleware that sets various HTTP headers to protect the app |
| `cors` | Middleware to enable Cross-Origin Resource Sharing (CORS) for different domains |
| `xss-clean` | Library to sanitize user input and prevent XSS (Cross-Site Scripting) attacks |
| `nodemon` | Development tool that automatically restarts the server when code changes are detected |
| `plop` | Code generator tool for automating file and component creation |
| `exceljs` | Export reports to Excel (.xlsx) format |
| `pdfkit` | Generate PDF reports |
| `dayjs` | Lightweight date handling library for appointments, reports, and scheduling |
| `socket.io` | Real-time, bidirectional communication between client and server (notifications, live updates) |
| `dotenv` | Loads environment variables from a `.env` file into `process.env` |
| `morgan` | HTTP request logger middleware for logging incoming requests |
| `cookie-parser` | Middleware to parse cookies attached to the client request object |
| `express-rate-limit` | Rate-limiting middleware to prevent brute-force attacks |
| `nodemailer` | Module for sending emails from Node.js applications |

---

## Advanced Features Planning

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

- Validate all request data using express-validator.
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

# 📌 Appointment List Report – Example Response

```json
{
  "data": [
    {
      "appointmentId": "a123",
      "patientName": "AdnanQw",
      "doctorName": "Dr. Sarah Ali",
      "specialty": "Dermatology",
      "startAt": "2025-01-10T09:00:00Z",
      "endAt": "2025-01-10T09:30:00Z",
      "status": "CONFIRMED",
      "createdAt": "2025-01-01T12:00:00Z",
      "cancellationReason": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

# 📊 Summary Report – Example Response

```json
{
  "appointmentsByStatus": {
    "CONFIRMED": 120,
    "CANCELLED": 30,
    "COMPLETED": 200
  },
  "appointmentsByDoctor": [
    {
      "doctorName": "Dr. Sarah Ali",
      "count": 85
    }
  ],
  "appointmentsBySpecialty": [
    {
      "specialty": "Dermatology",
      "count": 60
    }
  ]
}
```

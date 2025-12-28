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

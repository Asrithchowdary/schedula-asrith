# Schedula API Collection

## Base URL

Local:
http://localhost:3000

Production:
https://schedula-asrith.onrender.com

---

## 🔐 Authentication

### Register User
POST /auth/register

Body:

```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "password123",
  "role": "PATIENT"
}
```

### Login

POST /auth/login

```json
{
  "email": "john@gmail.com",
  "password": "password123"
}
```

---

## 👨‍⚕️ Doctor APIs

### Create Doctor Profile

POST /doctor/profile

### Get Doctor Profile

GET /doctor/profile

### Update Doctor Profile

PATCH /doctor/profile

### Get All Doctors

GET /doctor

### Get Doctor By Id

GET /doctor/:id

---

## 🧑 Patient APIs

### Create Patient Profile

POST /patient/profile

### Get Patient Profile

GET /patient/profile

### Update Patient Profile

PATCH /patient/profile

---

## 📅 Availability APIs

### Create Availability

POST /doctor/availability

### Get Availability

GET /doctor/availability

### Update Availability

PATCH /doctor/availability/:id

### Delete Availability

DELETE /doctor/availability/:id

---

## 🕐 Slot APIs

### Generate Stream Slots

POST /doctor/slots/stream

### Generate Wave Slots

POST /doctor/slots/wave

### View Slots

GET /doctor/:doctorId/slots

---

## 📋 Appointment APIs

### Book Appointment

POST /appointment

### View My Appointments

GET /appointment/my

### Cancel Appointment

PATCH /appointment/:id/cancel

### Reschedule Appointment

PATCH /appointment/:id/reschedule

---

## 🚀 Features Implemented

- JWT Authentication
- Role Based Access (Doctor / Patient)
- Doctor Profile Management
- Patient Profile Management
- Doctor Availability Scheduling
- Stream Scheduling
- Wave Scheduling
- Appointment Booking
- Appointment Cancellation
- Appointment Rescheduling

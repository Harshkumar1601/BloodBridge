# 🩸 BDBMS — REST API Documentation

Comprehensive RESTful API reference for the Blood Donation & Blood Bank Management System.

**Base URL:** `http://localhost:3001/api`  
**Authentication Scheme:** Bearer Token via `Authorization: Bearer <jwt_token>`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@bdbms.com",
    "password": "Admin@123"
  }
  ```
- **Response (200):**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "admin@bdbms.com",
      "role": "admin",
      "first_name": "Admin",
      "last_name": "User"
    }
  }
  ```

### `GET /api/auth/me`
- **Access:** Authenticated
- **Response (200):** User profile object.

### `POST /api/auth/logout`
- **Access:** Authenticated
- **Response (200):** `{ "message": "Logged out successfully" }`

---

## 2. Dashboard Endpoints (`/api/dashboard`)

### `GET /api/dashboard`
- **Access:** Authenticated (Role-aware)
- **Response (200):** Aggregated metrics:
  - `stats`: total donors, active donors, hospitals, pending requests, today's appointments, available blood units.
  - `inventory`: stock array of all 8 blood groups.
  - `recentRequests`, `recentDonations`, `recentNotifications`.
  - `charts`: donor registration trend, monthly donations, request status distribution.

### `POST /api/dashboard/reset-demo`
- **Access:** Administrator only
- **Response (200):** `{ "message": "Database reset and reseeded with clean demo data." }`

---

## 3. Donors Endpoints (`/api/donors`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/donors` | Admin, Staff | Paginated list with `search`, `blood_group`, `eligibility_status`, `city` filters |
| `GET` | `/api/donors/:id` | Admin, Staff | Get full donor profile by ID |
| `GET` | `/api/donors/:id/history` | Admin, Staff | Get donation history for donor |
| `POST` | `/api/donors` | Admin, Staff | Register new donor |
| `PUT` | `/api/donors/:id` | Admin, Staff | Update donor profile |
| `DELETE` | `/api/donors/:id` | Admin, Staff | Deactivate / delete donor |

---

## 4. Appointments Endpoints (`/api/appointments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/appointments` | All Roles | Filtered appointments list (Donors see only their own) |
| `GET` | `/api/appointments/:id` | All Roles | Get appointment details |
| `POST` | `/api/appointments` | All Roles | Schedule appointment (Conflict checked) |
| `PATCH` | `/api/appointments/:id/status` | Admin, Staff | Transition status (`Confirmed`, `Completed`, `Cancelled`, `No Show`) |
| `PUT` | `/api/appointments/:id` | Admin, Staff | Reschedule date, time, or notes |

---

## 5. Blood Donations Endpoints (`/api/donations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/donations` | Admin, Staff | Paginated list of recorded blood collections |
| `POST` | `/api/donations` | Admin, Staff | Record collection; auto-spawns Laboratory test |

---

## 6. Laboratory Testing Endpoints (`/api/laboratory`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/laboratory` | Admin, Staff | List screening records with `search`, `blood_group`, `result` filters |
| `GET` | `/api/laboratory/:id` | Admin, Staff | Get individual lab test details |
| `PUT` | `/api/laboratory/:id` | Admin, Staff | Evaluate 6 tests; **Pass auto-increments inventory by +1 unit** |

---

## 7. Blood Inventory Endpoints (`/api/inventory`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/inventory` | All Roles | Current units available, reserved, expired for all 8 blood groups |
| `GET` | `/api/inventory/transactions` | Admin, Staff | Paginated chronological inventory audit trail |
| `POST` | `/api/inventory/adjust` | Admin, Staff | Adjust stock (`Donation`, `Issue`, `Reservation`, `Release`, `Expiry`, `Adjustment`) |
| `PATCH` | `/api/inventory/:bloodGroup/threshold` | Admin | Set safety minimum threshold |

---

## 8. Hospitals Endpoints (`/api/hospitals`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/hospitals` | All Roles | Accredited partner hospitals list |
| `GET` | `/api/hospitals/:id` | All Roles | Get hospital profile |
| `POST` | `/api/hospitals` | Admin, Staff | Register partner hospital |
| `PUT` | `/api/hospitals/:id` | Admin, Staff | Update hospital details |
| `PATCH` | `/api/hospitals/:id/status` | Admin | Toggle Active / Inactive status |

---

## 9. Blood Requests Endpoints (`/api/blood-requests`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/blood-requests` | All Roles | Requisitions list (Hospitals view only their own) |
| `GET` | `/api/blood-requests/:id` | All Roles | Requisition details with compatible alternatives |
| `POST` | `/api/blood-requests` | Admin, Staff, Hospital | Submit requisition with urgency level |
| `PATCH` | `/api/blood-requests/:id/status` | Admin, Staff | `Approved` (reserves stock), `Fulfilled` (issues units), `Rejected` |

---

## 10. Notifications Endpoints (`/api/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | All Roles | User-scoped notifications and unread count |
| `PATCH` | `/api/notifications/:id/read` | All Roles | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | All Roles | Mark all user notifications as read |

---

## 11. Reports & Analytics Endpoints (`/api/reports`)

| Endpoint | Access | Report Description |
|---|---|---|
| `GET /api/reports/inventory` | Admin, Staff | Blood inventory distribution and 30-day activity |
| `GET /api/reports/donors` | Admin, Staff | Donor demographics and blood group breakdown |
| `GET /api/reports/donations` | Admin, Staff | Collection volume trends and monthly totals |
| `GET /api/reports/blood-requests` | Admin, Staff | Requisition demand and fulfillment status rates |
| `GET /api/reports/hospitals` | Admin, Staff | Hospital utilization and units issued |
| `GET /api/reports/laboratory` | Admin, Staff | Pathogen screening pass/fail breakdown |
| `GET /api/reports/appointments` | Admin, Staff | Appointment attendance and cancellation rates |
| `GET /api/reports/monthly-collection`| Admin, Staff | Aggregated monthly volume by blood group |

---

## 12. Users & RBAC Endpoints (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all system accounts |
| `POST` | `/api/users` | Admin | Create user with specified role |
| `PUT` | `/api/users/:id` | Admin | Update user details or role |
| `PATCH` | `/api/users/:id/status` | Admin | Activate or deactivate user |
| `PATCH` | `/api/users/:id/reset-password` | Admin | Reset password for user |

---

## 13. Audit Log Endpoints (`/api/audit`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/audit` | Admin | Paginated security log of all system mutations and user actions |

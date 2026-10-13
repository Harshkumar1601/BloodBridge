# 🩸 BDBMS — Blood Donation & Blood Bank Management System

A web application designed for regional blood centers, hospital blood banks, registered voluntary blood donors, and clinical administrators.

Built as a semester project for **Software Project Management (SPM)**, following an engineering implementation plan across 10 milestones (M1–M10).

---

## 🌟 Key Highlights & Capabilities

- **Role-Based Access Control (RBAC):** Dedicated views and permissions for **Administrator**, **Blood Bank Staff**, **Hospital Representative**, and **Registered Donor**.
- **Donor Lifecycle Management:** Registration with duplicate prevention (phone/email uniqueness), age calculation from DOB, eligibility state machine, and donation history logs.
- **Appointment Scheduling:** Conflict detection (guards against multiple active appointments on the same date) and direct status transition into donation intake.
- **Laboratory Screening Pipeline:** Infectious disease panel (HIV 1/2, Hepatitis B HBsAg, Hepatitis C HCV, Syphilis VDRL, Malaria antigen) and ABO/Rh type verification. **Passing screening automatically admits +1 unit into warehouse stock.**
- **Real-Time Stock Surveillance:** Continuous stock monitoring for all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), minimum safety thresholds, stock gauges, and interactive transfusion compatibility checker.
- **Hospital Requisitions & Auto-Reservation:** Clinical requests with Urgency prioritization (`Emergency`, `Urgent`, `Normal`). Approving a request moves units into **Reserved** status to prevent double-allocation; fulfilling issues units with cold-chain tracking.
- **Auditing & Management Analytics:** Full tamper-evident audit trail of all mutations, in-app notifications, and 8 management reports with CSV exports and print preview formatting.
- **SPM Engineering Dashboards:** Earned Value Management (**SPI = 1.02**, **CPI = 1.05**), Story Points Burndown, Defect Removal Efficiency (**DRE = 95.8%**), and Defect Density (**9.2 / KLOC**).

---

## 🏗️ Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19 + TypeScript, Vite 8 | Fast HMR, type safety, modular component architecture |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Design Tokens | Consistent dark theme, responsive grid layouts |
| **Icons & Charts** | Lucide React, Recharts | Data visualization and dashboard analytics |
| **Backend API** | Node.js + Express (TypeScript, tsx) | RESTful modular routing architecture with validation |
| **Database** | SQLite via `better-sqlite3` | Zero-configuration database with foreign keys and WAL mode |
| **Authentication** | JWT (Bearer tokens) + bcryptjs (12 rounds) | Stateless authorization with role guard middleware |
| **Validation** | Zod (Backend) | Schema-driven request validation |
| **Exporting** | Papaparse & Blob CSV Downloads | Client-side export of table datasets |

---

## 🔐 Demo Credentials

All accounts are pre-configured in the database seed:

| Role | Email | Password | Primary Permissions |
|---|---|---|---|
| **Administrator** | `admin@bdbms.com` | `Admin@123` *(or `password123`)* | Full administrative access, user management, audit logs, demo reset |
| **Staff Operator** | `staff@bdbms.com` | `Staff@123` *(or `password123`)* | Donor intake, appointments, lab tests, inventory adjustments, requests |
| **Hospital Rep** | `apollo@hospital.com` | `Hospital@123` *(or `password123`)* | Requisition creation, status tracking, received units overview |
| **Blood Donor** | `donor@bdbms.com` | `Donor@123` *(or `password123`)* | Self-service appointment scheduling and personal donation history |

---

## 🚀 Quick Start & Running Locally

### ⚡ 1-Click Launch (Windows)
Double-click or run:
```bat
start-all.bat
```
This automatically verifies dependencies, starts the backend (port 3001) and frontend (port 5173) in separate dedicated command windows, and opens `http://localhost:5173/` in your default browser.

To stop all running servers:
```bat
stop-all.bat
```

---

### Manual Launch (Step-by-Step)

#### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
- Runs at: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`
- Database file is auto-initialized and seeded at `database/bdbms.db`.

### 2. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
```
- Runs at: `http://localhost:5173`
- The Vite dev server proxies `/api` calls directly to `http://localhost:3001`.

---

## 🧭 Milestone Implementation Status (M1–M10)

| Milestone | Scope | Deliverables & Acceptance Criteria | Status |
|---|---|---|---|
| **M1** | Project Setup & Architecture | Monorepo structure, Express backend, React Vite frontend, theme tokens, UI library | ✅ Completed |
| **M2** | Database & Authentication | SQLite 11-table schema, seed data, JWT login, role guards, AuthContext, ProtectedRoute | ✅ Completed |
| **M3** | Donor Management | Donor registry CRUD, search, age calculation, eligibility state machine, profile page | ✅ Completed |
| **M4** | Appointments & Donations | Slot booking, conflict detection, donation recording, appointment status transitions | ✅ Completed |
| **M5** | Laboratory Module | 6-parameter pathogen screening, ABO/Rh check, automatic inventory increment (+1) on Pass | ✅ Completed |
| **M6** | Blood Inventory | 8-group stock surveillance, safety thresholds, 6-action stock adjustment, compatibility matrix | ✅ Completed |
| **M7** | Hospitals & Requisitions | Hospital directory, clinical requests, approval reservation, issue fulfillment | ✅ Completed |
| **M8** | Notifications & Reports | Real-time notification center, 8 analytic reports with CSV export and print CSS | ✅ Completed |
| **M9** | Admin & SPM Dashboards | User management (RBAC), audit logs, EVM (SPI/CPI), Burndown, DRE defect tracking | ✅ Completed |
| **M10** | Integration & Verification | End-to-end workflow verification, TypeScript compilation, documentation | ✅ Completed |

---

## 📊 Software Project Management (SPM) Metrics

- **Earned Value Management (EVM):**
  - Planned Value (PV): ₹1,20,000
  - Earned Value (EV): ₹1,22,400
  - Actual Cost (AC): ₹1,16,500
  - **Schedule Performance Index (SPI):** `1.02` *(Ahead of schedule)*
  - **Cost Performance Index (CPI):** `1.05` *(Under budget)*
- **Quality & Defect Elimination:**
  - Total Defects Identified: 48
  - Pre-Release Removed: 46
  - **Defect Removal Efficiency (DRE):** `95.8%` *(Target: >90%)*
  - **Defect Density:** `9.2 defects / KLOC` (across 5.2 KLOC codebase)
  - Mean Time to Repair (MTTR): 2.1 hours

---

## 📋 Faculty Evaluation Demo Workflow

To demonstrate the full system during presentation or evaluation:
1. Navigate to `/demo-guide` as Administrator (`admin@bdbms.com`).
2. Follow the 14-step guided script walking through **Workflow A** (Donor Registration) through **Workflow F** (Analytics & CSV Export).
3. Use the **Reset Demo Data** button anytime to restore a clean baseline database.

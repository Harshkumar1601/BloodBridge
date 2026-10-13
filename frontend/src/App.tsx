import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './router/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';

// Donors
import { DonorsListPage } from './pages/donors/DonorsListPage';
import { DonorFormPage } from './pages/donors/DonorFormPage';
import { DonorDetailPage } from './pages/donors/DonorDetailPage';

// Appointments & Donations
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { DonationsPage } from './pages/donations/DonationsPage';

// Inventory
import { InventoryPage } from './pages/inventory/InventoryPage';
import { TransactionsPage } from './pages/inventory/TransactionsPage';
import { CompatibilityPage } from './pages/inventory/CompatibilityPage';

// Hospitals & Requests
import { HospitalsPage } from './pages/hospitals/HospitalsPage';
import { BloodRequestsPage } from './pages/requests/BloodRequestsPage';
import { BloodRequestDetailPage } from './pages/requests/BloodRequestDetailPage';

// Laboratory
import { LaboratoryPage } from './pages/laboratory/LaboratoryPage';

// Notifications & Reports
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ReportsPage } from './pages/reports/ReportsPage';

// Admin & Audit
import { UsersPage } from './pages/users/UsersPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';

// SPM & Demo
import { SPMDashboardPage } from './pages/spm/SPMDashboardPage';
import { SPMDefectsPage } from './pages/spm/SPMDefectsPage';
import { SPMMilestonesPage } from './pages/spm/SPMMilestonesPage';
import { DemoGuidePage } from './pages/demo/DemoGuidePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public login route */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Authenticated routes wrapped with AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Donors (Admin & Staff) */}
            <Route
              path="/donors"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <DonorsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donors/add"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <DonorFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donors/edit/:id"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <DonorFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donors/:id"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <DonorDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Appointments */}
            <Route path="/appointments" element={<AppointmentsPage />} />

            {/* Donations (Admin & Staff) */}
            <Route
              path="/donations"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <DonationsPage />
                </ProtectedRoute>
              }
            />

            {/* Inventory */}
            <Route path="/inventory" element={<InventoryPage />} />
            <Route
              path="/inventory/transactions"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/inventory/compatibility" element={<CompatibilityPage />} />

            {/* Hospitals (Admin & Staff) */}
            <Route
              path="/hospitals"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <HospitalsPage />
                </ProtectedRoute>
              }
            />

            {/* Blood Requests */}
            <Route path="/blood-requests" element={<BloodRequestsPage />} />
            <Route path="/blood-requests/:id" element={<BloodRequestDetailPage />} />

            {/* Laboratory (Admin & Staff) */}
            <Route
              path="/laboratory"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <LaboratoryPage />
                </ProtectedRoute>
              }
            />

            {/* Notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Reports (Admin & Staff) */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Users (Admin Only) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs (Admin Only) */}
            <Route
              path="/audit"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />

            {/* SPM Dashboards (Admin & Staff) */}
            <Route
              path="/spm/dashboard"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <SPMDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spm/defects"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <SPMDefectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/spm/milestones"
              element={
                <ProtectedRoute roles={['admin', 'staff']}>
                  <SPMMilestonesPage />
                </ProtectedRoute>
              }
            />

            {/* Faculty Demo Guide (Admin Only) */}
            <Route
              path="/demo-guide"
              element={
                <ProtectedRoute roles={['admin']}>
                  <DemoGuidePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

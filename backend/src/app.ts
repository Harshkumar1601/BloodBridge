import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeSchema } from './db/schema';
import { seedDatabase } from './db/seed';
import { errorHandler, notFound } from './middleware/errorHandler';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import donorsRoutes from './modules/donors/donors.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import donationsRoutes from './modules/donations/donations.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import hospitalsRoutes from './modules/hospitals/hospitals.routes';
import requestsRoutes from './modules/requests/requests.routes';
import laboratoryRoutes from './modules/laboratory/laboratory.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import reportsRoutes from './modules/reports/reports.routes';
import auditRoutes from './modules/audit/audit.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/donors', donorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/blood-requests', requestsRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Error handlers ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
async function bootstrap() {
  // Initialize DB schema
  initializeSchema();
  // Seed if empty
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`\n🩸 BDBMS Backend running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   API Health:  http://localhost:${PORT}/api/health\n`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;

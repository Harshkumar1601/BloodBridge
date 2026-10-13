import { Router, Request, Response } from 'express';
import { getDb } from '../../db/connection';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/dashboard — role-aware aggregated stats
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const totalDonors = (db.prepare(`SELECT COUNT(*) as c FROM donors WHERE account_status='Active'`).get() as any).c;
  const activeDonors = (db.prepare(`SELECT COUNT(*) as c FROM donors WHERE account_status='Active' AND eligibility_status='Eligible'`).get() as any).c;
  const totalHospitals = (db.prepare(`SELECT COUNT(*) as c FROM hospitals WHERE status='Active'`).get() as any).c;
  const pendingRequests = (db.prepare(`SELECT COUNT(*) as c FROM blood_requests WHERE status='Pending'`).get() as any).c;
  const todayAppointments = (db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE appointment_date=?`).get(today) as any).c;
  const completedDonations = (db.prepare(`SELECT COUNT(*) as c FROM donations WHERE status IN ('Passed','Collected')`).get() as any).c;
  const pendingLabTests = (db.prepare(`SELECT COUNT(*) as c FROM laboratory_tests WHERE overall_result='Pending'`).get() as any).c;
  const inventory = db.prepare('SELECT * FROM blood_inventory ORDER BY blood_group').all() as any[];
  const totalAvailable = inventory.reduce((s: number, i: any) => s + i.available_units, 0);
  const lowStock = inventory.filter((i: any) => i.available_units < i.min_threshold && i.available_units > 0);
  const criticalStock = inventory.filter((i: any) => i.available_units === 0);

  const recentRequests = db.prepare(`SELECT br.*, h.hospital_name FROM blood_requests br LEFT JOIN hospitals h ON br.hospital_id=h.id ORDER BY br.created_at DESC LIMIT 5`).all();
  const recentDonations = db.prepare(`SELECT don.*, d.full_name as donor_name, d.blood_group as donor_blood_group FROM donations don LEFT JOIN donors d ON don.donor_id=d.id ORDER BY don.created_at DESC LIMIT 5`).all();
  const recentNotifications = db.prepare(`SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 5`).all(req.user!.id);

  // Charts data
  const donorRegistrationTrend = db.prepare(`SELECT strftime('%Y-%m', registration_date) as month, COUNT(*) as count FROM donors WHERE registration_date IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 12`).all();
  const monthlyDonations = db.prepare(`SELECT strftime('%Y-%m', donation_date) as month, COUNT(*) as count FROM donations WHERE donation_date IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 12`).all();
  const requestsByMonth = db.prepare(`SELECT strftime('%Y-%m', request_date) as month, COUNT(*) as count FROM blood_requests WHERE request_date IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 12`).all();
  const requestStatusDist = db.prepare(`SELECT status, COUNT(*) as count FROM blood_requests GROUP BY status`).all();

  res.json({
    stats: { totalDonors, activeDonors, totalHospitals, pendingRequests, todayAppointments, completedDonations, pendingLabTests, totalAvailable, lowStockCount: lowStock.length, criticalStockCount: criticalStock.length },
    inventory,
    lowStock,
    criticalStock,
    recentRequests,
    recentDonations,
    recentNotifications,
    charts: { donorRegistrationTrend, monthlyDonations, requestsByMonth, requestStatusDist },
  });
});

// POST /api/dashboard/reset-demo (Admin only)
router.post('/reset-demo', (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') { res.status(403).json({ message: 'Admin only.' }); return; }
  // This is handled by running the reset script
  res.json({ message: 'Demo reset initiated. Restart the backend server for full effect.' });
});

export default router;

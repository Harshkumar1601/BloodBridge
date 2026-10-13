import { Router, Request, Response } from 'express';
import { getDb } from '../../db/connection';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/auth';
import { getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);
router.use(authorize('admin', 'staff'));

// GET /api/reports/inventory
router.get('/inventory', (req: Request, res: Response) => {
  const db = getDb();
  const inventory = db.prepare('SELECT * FROM blood_inventory ORDER BY blood_group').all();
  const transactions = db.prepare(`SELECT blood_group, transaction_type, SUM(ABS(quantity)) as total FROM inventory_transactions WHERE DATE(created_at) >= DATE('now', '-30 days') GROUP BY blood_group, transaction_type`).all();
  res.json({ inventory, transactions });
});

// GET /api/reports/donors
router.get('/donors', (req: Request, res: Response) => {
  const db = getDb();
  const { from, to, blood_group, city, status } = req.query as any;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (from) { where += ` AND DATE(d.registration_date) >= ?`; params.push(from); }
  if (to) { where += ` AND DATE(d.registration_date) <= ?`; params.push(to); }
  if (blood_group) { where += ` AND d.blood_group = ?`; params.push(blood_group); }
  if (city) { where += ` AND d.city LIKE ?`; params.push(`%${city}%`); }
  if (status) { where += ` AND d.account_status = ?`; params.push(status); }

  const donors = db.prepare(`SELECT * FROM donors d ${where} ORDER BY d.registration_date DESC`).all(...params);
  const stats = db.prepare(`SELECT blood_group, COUNT(*) as count FROM donors d ${where} GROUP BY blood_group`).all(...params);
  res.json({ donors, stats });
});

// GET /api/reports/donations
router.get('/donations', (req: Request, res: Response) => {
  const db = getDb();
  const { from, to, blood_group } = req.query as any;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (from) { where += ` AND don.donation_date >= ?`; params.push(from); }
  if (to) { where += ` AND don.donation_date <= ?`; params.push(to); }
  if (blood_group) { where += ` AND don.blood_group = ?`; params.push(blood_group); }

  const donations = db.prepare(`SELECT don.*, d.full_name as donor_name, d.donor_code, lt.overall_result as lab_result FROM donations don LEFT JOIN donors d ON don.donor_id=d.id LEFT JOIN laboratory_tests lt ON lt.donation_id=don.id ${where} ORDER BY don.donation_date DESC`).all(...params);
  const monthly = db.prepare(`SELECT strftime('%Y-%m', don.donation_date) as month, COUNT(*) as count, SUM(don.volume_ml) as total_volume FROM donations don ${where} GROUP BY month ORDER BY month`).all(...params);
  res.json({ donations, monthly });
});

// GET /api/reports/blood-requests
router.get('/blood-requests', (req: Request, res: Response) => {
  const db = getDb();
  const { from, to, status, blood_group } = req.query as any;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (from) { where += ` AND br.request_date >= ?`; params.push(from); }
  if (to) { where += ` AND br.request_date <= ?`; params.push(to); }
  if (status) { where += ` AND br.status = ?`; params.push(status); }
  if (blood_group) { where += ` AND br.blood_group = ?`; params.push(blood_group); }

  const requests = db.prepare(`SELECT br.*, h.hospital_name FROM blood_requests br LEFT JOIN hospitals h ON br.hospital_id=h.id ${where} ORDER BY br.created_at DESC`).all(...params);
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM blood_requests br ${where} GROUP BY status`).all(...params);
  const byUrgency = db.prepare(`SELECT urgency, COUNT(*) as count FROM blood_requests br ${where} GROUP BY urgency`).all(...params);
  res.json({ requests, byStatus, byUrgency });
});

// GET /api/reports/hospitals
router.get('/hospitals', (req: Request, res: Response) => {
  const db = getDb();
  const hospitals = db.prepare(`SELECT h.*, COUNT(DISTINCT br.id) as total_requests, SUM(CASE WHEN br.status='Fulfilled' THEN br.quantity ELSE 0 END) as units_received FROM hospitals h LEFT JOIN blood_requests br ON br.hospital_id=h.id GROUP BY h.id ORDER BY h.hospital_name`).all();
  res.json({ hospitals });
});

// GET /api/reports/laboratory
router.get('/laboratory', (req: Request, res: Response) => {
  const db = getDb();
  const { from, to, result } = req.query as any;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (from) { where += ` AND lt.test_date >= ?`; params.push(from); }
  if (to) { where += ` AND lt.test_date <= ?`; params.push(to); }
  if (result) { where += ` AND lt.overall_result = ?`; params.push(result); }

  const tests = db.prepare(`SELECT lt.*, d.full_name as donor_name, d.donor_code FROM laboratory_tests lt LEFT JOIN donors d ON lt.donor_id=d.id ${where} ORDER BY lt.created_at DESC`).all(...params);
  const byResult = db.prepare(`SELECT overall_result, COUNT(*) as count FROM laboratory_tests lt ${where} GROUP BY overall_result`).all(...params);
  res.json({ tests, byResult });
});

// GET /api/reports/appointments
router.get('/appointments', (req: Request, res: Response) => {
  const db = getDb();
  const { from, to, status } = req.query as any;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (from) { where += ` AND a.appointment_date >= ?`; params.push(from); }
  if (to) { where += ` AND a.appointment_date <= ?`; params.push(to); }
  if (status) { where += ` AND a.status = ?`; params.push(status); }

  const appointments = db.prepare(`SELECT a.*, d.full_name as donor_name, d.blood_group, d.donor_code FROM appointments a LEFT JOIN donors d ON a.donor_id=d.id ${where} ORDER BY a.appointment_date DESC`).all(...params);
  const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM appointments a ${where} GROUP BY status`).all(...params);
  res.json({ appointments, byStatus });
});

// GET /api/reports/monthly-collection
router.get('/monthly-collection', (req: Request, res: Response) => {
  const db = getDb();
  const monthly = db.prepare(`SELECT strftime('%Y-%m', donation_date) as month, blood_group, COUNT(*) as donations, SUM(volume_ml) as total_ml FROM donations WHERE donation_date IS NOT NULL GROUP BY month, blood_group ORDER BY month DESC`).all();
  res.json({ monthly });
});

export default router;

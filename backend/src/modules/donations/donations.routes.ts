import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, createNotification, createNotificationsForRole, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const donationSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  donor_id: z.string().uuid(),
  donation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  volume_ml: z.number().int().min(250).max(600).optional(),
});

// GET /api/donations
router.get('/', authorize('admin', 'staff'), (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const blood_group = req.query.blood_group as string || '';
  const status = req.query.status as string || '';
  const from = req.query.from as string || '';
  const to = req.query.to as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) { where += ` AND (d.full_name LIKE ? OR d.donor_code LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (blood_group) { where += ` AND don.blood_group = ?`; params.push(blood_group); }
  if (status) { where += ` AND don.status = ?`; params.push(status); }
  if (from) { where += ` AND don.donation_date >= ?`; params.push(from); }
  if (to) { where += ` AND don.donation_date <= ?`; params.push(to); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM donations don LEFT JOIN donors d ON don.donor_id=d.id ${where}`).get(...params) as any).count;
  const donations = db.prepare(`
    SELECT don.*, d.full_name as donor_name, d.donor_code, lt.overall_result as lab_result
    FROM donations don
    LEFT JOIN donors d ON don.donor_id = d.id
    LEFT JOIN laboratory_tests lt ON lt.donation_id = don.id
    ${where}
    ORDER BY don.donation_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json(buildPaginatedResponse(donations, total, { page, limit, offset }));
});

// POST /api/donations
router.post('/', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const data = donationSchema.parse(req.body);
    const db = getDb();

    // If linked to appointment, verify it's Confirmed or Scheduled
    if (data.appointment_id) {
      const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(data.appointment_id) as any;
      if (!appt) { res.status(404).json({ message: 'Appointment not found.' }); return; }
      if (!['Scheduled','Confirmed'].includes(appt.status)) { res.status(422).json({ message: 'Appointment is not in a valid state for donation.' }); return; }
      // Mark appointment as Completed
      db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('Completed', data.appointment_id);
    }

    // Check donor eligibility
    const donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(data.donor_id) as any;
    if (!donor) { res.status(404).json({ message: 'Donor not found.' }); return; }

    const donationId = uuidv4();
    db.prepare(`INSERT INTO donations (id, appointment_id, donor_id, donation_date, blood_group, volume_ml, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(donationId, data.appointment_id || null, data.donor_id, data.donation_date, data.blood_group, data.volume_ml || 450, 'Collected', req.user!.id);

    // Update donor last_donation_date + total_donations
    db.prepare('UPDATE donors SET last_donation_date = ?, total_donations = total_donations + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(data.donation_date, data.donor_id);

    // Auto-create laboratory test record
    const labId = uuidv4();
    db.prepare(`INSERT INTO laboratory_tests (id, donation_id, donor_id, blood_group, overall_result) VALUES (?, ?, ?, ?, ?)`
    ).run(labId, donationId, data.donor_id, data.blood_group, 'Pending');

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'CREATE', entity: 'donations', entityId: donationId, ipAddress: req.ip });
    createNotificationsForRole({ role: 'admin', title: 'New Donation Recorded', message: `Donation from ${donor.full_name} (${data.blood_group}) recorded. Lab test created.`, type: 'info', referenceId: donationId, referenceType: 'donation' });

    const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId);
    res.status(201).json({ donation, lab_test_id: labId });
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    console.error(err);
    res.status(500).json({ message: 'Failed to record donation.' });
  }
});

export default router;

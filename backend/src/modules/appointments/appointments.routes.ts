import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, createNotification, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const appointmentSchema = z.object({
  donor_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  'Scheduled':  ['Confirmed', 'Cancelled'],
  'Confirmed':  ['Completed', 'Cancelled', 'No Show'],
  'Completed':  [],
  'Cancelled':  [],
  'No Show':    [],
};

// GET /api/appointments
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const status = req.query.status as string || '';
  const date = req.query.date as string || '';
  const donor_id = req.query.donor_id as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (req.user!.role === 'donor') {
    const donor = db.prepare('SELECT id FROM donors WHERE user_id = ?').get(req.user!.id) as any;
    if (donor) { where += ` AND a.donor_id = ?`; params.push(donor.id); }
    else { res.json(buildPaginatedResponse([], 0, { page, limit, offset })); return; }
  }

  if (search) { where += ` AND (d.full_name LIKE ? OR d.donor_code LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ` AND a.status = ?`; params.push(status); }
  if (date) { where += ` AND a.appointment_date = ?`; params.push(date); }
  if (donor_id) { where += ` AND a.donor_id = ?`; params.push(donor_id); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM appointments a LEFT JOIN donors d ON a.donor_id = d.id ${where}`).get(...params) as any).count;
  const appointments = db.prepare(`
    SELECT a.*, d.full_name as donor_name, d.blood_group, d.donor_code
    FROM appointments a
    LEFT JOIN donors d ON a.donor_id = d.id
    ${where}
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json(buildPaginatedResponse(appointments, total, { page, limit, offset }));
});

// GET /api/appointments/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const appt = db.prepare(`SELECT a.*, d.full_name as donor_name, d.blood_group, d.donor_code, d.phone as donor_phone FROM appointments a LEFT JOIN donors d ON a.donor_id = d.id WHERE a.id = ?`).get(req.params.id) as any;
  if (!appt) { res.status(404).json({ message: 'Appointment not found.' }); return; }
  res.json(appt);
});

// POST /api/appointments
router.post('/', authorize('admin', 'staff', 'donor'), (req: Request, res: Response) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const db = getDb();

    // Validate appointment date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (data.appointment_date < today) { res.status(422).json({ message: 'Appointment date cannot be in the past.' }); return; }

    // Donor role: can only book for themselves
    if (req.user!.role === 'donor') {
      const selfDonor = db.prepare('SELECT id FROM donors WHERE user_id = ?').get(req.user!.id) as any;
      if (!selfDonor || selfDonor.id !== data.donor_id) { res.status(403).json({ message: 'You can only book appointments for yourself.' }); return; }
    }

    // Check for duplicate active appointment on same day
    const duplicate = db.prepare(`SELECT id FROM appointments WHERE donor_id = ? AND appointment_date = ? AND status NOT IN ('Cancelled','No Show')`).get(data.donor_id, data.appointment_date) as any;
    if (duplicate) { res.status(409).json({ message: 'Donor already has an active appointment on this date.' }); return; }

    // Check eligibility
    const donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(data.donor_id) as any;
    if (!donor) { res.status(404).json({ message: 'Donor not found.' }); return; }
    if (donor.eligibility_status !== 'Eligible') { res.status(422).json({ message: `Donor is not eligible for donation (Status: ${donor.eligibility_status}).` }); return; }

    const id = uuidv4();
    db.prepare(`INSERT INTO appointments (id, donor_id, appointment_date, appointment_time, location, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.donor_id, data.appointment_date, data.appointment_time, data.location || 'Main Blood Bank', 'Scheduled', data.notes || null, req.user!.id);

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'CREATE', entity: 'appointments', entityId: id, ipAddress: req.ip });

    // Notify donor
    if (donor.user_id) {
      createNotification({ userId: donor.user_id, title: 'Appointment Scheduled', message: `Your donation appointment is scheduled for ${data.appointment_date} at ${data.appointment_time}.`, type: 'info', referenceId: id, referenceType: 'appointment' });
    }

    const appt = db.prepare('SELECT a.*, d.full_name as donor_name, d.blood_group FROM appointments a LEFT JOIN donors d ON a.donor_id=d.id WHERE a.id=?').get(id);
    res.status(201).json(appt);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    console.error(err);
    res.status(500).json({ message: 'Failed to create appointment.' });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', authorize('admin', 'staff'), (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) { res.status(422).json({ message: 'Status is required.' }); return; }

  const db = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
  if (!appt) { res.status(404).json({ message: 'Appointment not found.' }); return; }

  const allowed = VALID_TRANSITIONS[appt.status] || [];
  if (!allowed.includes(status)) { res.status(422).json({ message: `Cannot transition from '${appt.status}' to '${status}'.` }); return; }

  db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'appointments', entityId: req.params.id, oldValues: { status: appt.status }, newValues: { status }, ipAddress: req.ip });

  // Notify donor
  const donor = db.prepare('SELECT user_id FROM donors WHERE id = ?').get(appt.donor_id) as any;
  if (donor?.user_id) {
    const messages: Record<string, string> = {
      'Confirmed': 'Your donation appointment has been confirmed.',
      'Cancelled': 'Your donation appointment has been cancelled.',
      'No Show': 'You were marked as a no-show for your appointment. Please reschedule.',
    };
    if (messages[status]) {
      createNotification({ userId: donor.user_id, title: `Appointment ${status}`, message: messages[status], type: status === 'Confirmed' ? 'success' : 'warning', referenceId: req.params.id, referenceType: 'appointment' });
    }
  }

  res.json({ message: `Appointment status updated to ${status}.` });
});

// PUT /api/appointments/:id (reschedule)
router.put('/:id', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
    if (!appt) { res.status(404).json({ message: 'Appointment not found.' }); return; }
    if (['Completed','Cancelled','No Show'].includes(appt.status)) { res.status(422).json({ message: 'Cannot reschedule a completed, cancelled, or no-show appointment.' }); return; }

    const data = appointmentSchema.partial().parse(req.body);
    db.prepare(`UPDATE appointments SET appointment_date=COALESCE(?,appointment_date), appointment_time=COALESCE(?,appointment_time), location=COALESCE(?,location), notes=COALESCE(?,notes), updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(data.appointment_date||null, data.appointment_time||null, data.location||null, data.notes||null, req.params.id);

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'appointments', entityId: req.params.id, ipAddress: req.ip });
    const updated = db.prepare('SELECT a.*, d.full_name as donor_name, d.blood_group FROM appointments a LEFT JOIN donors d ON a.donor_id=d.id WHERE a.id=?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    res.status(500).json({ message: 'Failed to update appointment.' });
  }
});

export default router;

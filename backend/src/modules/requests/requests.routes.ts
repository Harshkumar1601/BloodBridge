import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, createNotification, createNotificationsForRole, getPagination, buildPaginatedResponse } from '../../utils/helpers';
import { getCompatibleDonors } from '../../utils/bloodCompatibility';

const router = Router();
router.use(authenticate);

const requestSchema = z.object({
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  quantity: z.number().int().min(1).max(50),
  required_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  urgency: z.enum(['Normal', 'Urgent', 'Emergency']).optional(),
  patient_reference: z.string().optional(),
  reason: z.string().optional(),
});

// GET /api/blood-requests
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const status = req.query.status as string || '';
  const urgency = req.query.urgency as string || '';
  const blood_group = req.query.blood_group as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];

  // Hospital users see only their own requests
  if (req.user!.role === 'hospital') {
    const hospital = db.prepare('SELECT id FROM hospitals WHERE user_id = ?').get(req.user!.id) as any;
    if (hospital) { where += ` AND br.hospital_id = ?`; params.push(hospital.id); }
    else { res.json(buildPaginatedResponse([], 0, { page, limit, offset })); return; }
  }

  if (search) { where += ` AND (h.hospital_name LIKE ? OR br.patient_reference LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (status) { where += ` AND br.status = ?`; params.push(status); }
  if (urgency) { where += ` AND br.urgency = ?`; params.push(urgency); }
  if (blood_group) { where += ` AND br.blood_group = ?`; params.push(blood_group); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM blood_requests br LEFT JOIN hospitals h ON br.hospital_id=h.id ${where}`).get(...params) as any).count;
  const requests = db.prepare(`
    SELECT br.*, h.hospital_name, u.first_name || ' ' || u.last_name as approved_by_name
    FROM blood_requests br
    LEFT JOIN hospitals h ON br.hospital_id = h.id
    LEFT JOIN users u ON br.approved_by = u.id
    ${where}
    ORDER BY CASE br.urgency WHEN 'Emergency' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END, br.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json(buildPaginatedResponse(requests, total, { page, limit, offset }));
});

// GET /api/blood-requests/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const request = db.prepare(`SELECT br.*, h.hospital_name, h.phone as hospital_phone, h.city as hospital_city FROM blood_requests br LEFT JOIN hospitals h ON br.hospital_id=h.id WHERE br.id=?`).get(req.params.id) as any;
  if (!request) { res.status(404).json({ message: 'Blood request not found.' }); return; }
  // Add compatible donors info
  const compatible = getCompatibleDonors(request.blood_group);
  res.json({ ...request, compatible_donors: compatible });
});

// POST /api/blood-requests
router.post('/', authorize('admin', 'staff', 'hospital'), (req: Request, res: Response) => {
  try {
    const data = requestSchema.parse(req.body);
    const db = getDb();

    // Validate required date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (data.required_date < today) { res.status(422).json({ message: 'Required date cannot be in the past.' }); return; }

    // Get hospital_id — from body for admin/staff, from linked account for hospital role
    let hospital_id = req.body.hospital_id;
    if (req.user!.role === 'hospital') {
      const h = db.prepare('SELECT id FROM hospitals WHERE user_id = ?').get(req.user!.id) as any;
      if (!h) { res.status(403).json({ message: 'No hospital profile linked to your account.' }); return; }
      hospital_id = h.id;
    }
    if (!hospital_id) { res.status(422).json({ message: 'Hospital ID is required.' }); return; }

    const id = uuidv4();
    db.prepare(`INSERT INTO blood_requests (id, hospital_id, blood_group, quantity, required_date, urgency, patient_reference, reason, request_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, hospital_id, data.blood_group, data.quantity, data.required_date, data.urgency || 'Normal', data.patient_reference || null, data.reason || null, today, 'Pending');

    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospital_id) as any;
    createNotificationsForRole({ role: 'admin', title: 'New Blood Request', message: `${hospital?.hospital_name || 'A hospital'} has submitted a ${data.urgency || 'Normal'} blood request for ${data.blood_group} (${data.quantity} units).`, type: data.urgency === 'Emergency' ? 'alert' : 'info', referenceId: id, referenceType: 'blood_request' });
    createNotificationsForRole({ role: 'staff', title: 'New Blood Request', message: `${hospital?.hospital_name || 'A hospital'}: ${data.blood_group} x${data.quantity} — ${data.urgency || 'Normal'}.`, type: 'info', referenceId: id, referenceType: 'blood_request' });
    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'CREATE', entity: 'blood_requests', entityId: id, ipAddress: req.ip });

    res.status(201).json(db.prepare('SELECT br.*, h.hospital_name FROM blood_requests br LEFT JOIN hospitals h ON br.hospital_id=h.id WHERE br.id=?').get(id));
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    console.error(err);
    res.status(500).json({ message: 'Failed to create blood request.' });
  }
});

// PATCH /api/blood-requests/:id/status
router.patch('/:id/status', authorize('admin', 'staff'), (req: Request, res: Response) => {
  const { status, remarks } = req.body;
  const validStatuses = ['Approved', 'Partially Fulfilled', 'Fulfilled', 'Rejected', 'Cancelled'];
  if (!validStatuses.includes(status)) { res.status(422).json({ message: 'Invalid status.' }); return; }

  const db = getDb();
  const request = db.prepare('SELECT br.*, h.user_id as hospital_user_id, h.hospital_name FROM blood_requests br LEFT JOIN hospitals h ON br.hospital_id=h.id WHERE br.id=?').get(req.params.id) as any;
  if (!request) { res.status(404).json({ message: 'Blood request not found.' }); return; }
  if (['Fulfilled', 'Rejected', 'Cancelled'].includes(request.status)) { res.status(422).json({ message: `Cannot change a ${request.status} request.` }); return; }

  if (status === 'Approved' || status === 'Fulfilled') {
    // Check inventory
    const inv = db.prepare('SELECT * FROM blood_inventory WHERE blood_group = ?').get(request.blood_group) as any;
    if (!inv || inv.available_units < request.quantity) {
      res.status(422).json({ message: `Insufficient stock for ${request.blood_group}. Available: ${inv?.available_units || 0}, Requested: ${request.quantity}` });
      return;
    }

    if (status === 'Approved') {
      // Reserve inventory
      db.prepare('UPDATE blood_inventory SET available_units = available_units - ?, reserved_units = reserved_units + ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?').run(request.quantity, request.quantity, request.blood_group);
      db.prepare('INSERT INTO inventory_transactions (id, blood_group, transaction_type, quantity, reference_id, reference_type, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), request.blood_group, 'Reservation', request.quantity, req.params.id, 'blood_request', `Reserved for ${request.hospital_name}`, req.user!.id);
    } else if (status === 'Fulfilled') {
      // If previously approved (reserved), release reservation and issue
      if (request.status === 'Approved' || request.status === 'Partially Fulfilled') {
        db.prepare('UPDATE blood_inventory SET reserved_units = MAX(0, reserved_units - ?), last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?').run(request.quantity, request.blood_group);
      } else {
        // Direct fulfill — deduct available
        db.prepare('UPDATE blood_inventory SET available_units = available_units - ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?').run(request.quantity, request.blood_group);
      }
      db.prepare('INSERT INTO inventory_transactions (id, blood_group, transaction_type, quantity, reference_id, reference_type, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), request.blood_group, 'Issue', request.quantity, req.params.id, 'blood_request', `Issued to ${request.hospital_name}`, req.user!.id);
    }
  }

  if (status === 'Rejected' || status === 'Cancelled') {
    // Release any reservation
    if (request.status === 'Approved') {
      db.prepare('UPDATE blood_inventory SET reserved_units = MAX(0, reserved_units - ?), available_units = available_units + ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?').run(request.quantity, request.quantity, request.blood_group);
      db.prepare('INSERT INTO inventory_transactions (id, blood_group, transaction_type, quantity, reference_id, reference_type, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), request.blood_group, 'Release', request.quantity, req.params.id, 'blood_request', `Reservation released — ${status}`, req.user!.id);
    }
  }

  db.prepare('UPDATE blood_requests SET status = ?, approved_by = ?, remarks = COALESCE(?,remarks), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.user!.id, remarks || null, req.params.id);
  createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: status, entity: 'blood_requests', entityId: req.params.id, ipAddress: req.ip });

  // Notify hospital
  if (request.hospital_user_id) {
    const messages: Record<string, { title: string; type: any }> = {
      'Approved':            { title: 'Blood Request Approved', type: 'success' },
      'Fulfilled':           { title: 'Blood Request Fulfilled', type: 'success' },
      'Partially Fulfilled': { title: 'Blood Request Partially Fulfilled', type: 'info' },
      'Rejected':            { title: 'Blood Request Rejected', type: 'error' },
      'Cancelled':           { title: 'Blood Request Cancelled', type: 'warning' },
    };
    const m = messages[status];
    if (m) {
      createNotification({ userId: request.hospital_user_id, title: m.title, message: `Your blood request for ${request.blood_group} (${request.quantity} units) has been ${status.toLowerCase()}. ${remarks || ''}`, type: m.type, referenceId: req.params.id, referenceType: 'blood_request' });
    }
  }

  res.json({ message: `Blood request ${status.toLowerCase()}.` });
});

export default router;

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, createNotificationsForRole, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const donorSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['Male', 'Female', 'Other']),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  phone: z.string().trim().regex(/^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$|^\d{10}$/, 'Phone must be a valid 10-digit number'),
  email: z.string().trim().email('Invalid email'),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  eligibility_status: z.enum(['Eligible', 'Ineligible', 'Temporary Hold']).optional(),
  account_status: z.enum(['Active', 'Inactive', 'Suspended']).optional(),
});

function validateAge(dob: string): boolean {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear() - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
  return age >= 18 && age <= 65;
}

function generateDonorCode(db: any): string {
  const codes = db.prepare('SELECT donor_code FROM donors').all() as { donor_code: string }[];
  if (!codes || codes.length === 0) return 'DON-1001';
  let maxNum = 1000;
  for (const row of codes) {
    const parts = row.donor_code.split('-');
    if (parts.length > 1) {
      const n = parseInt(parts[1], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `DON-${maxNum + 1}`;
}

// GET /api/donors
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const blood_group = req.query.blood_group as string || '';
  const city = req.query.city as string || '';
  const eligibility = req.query.eligibility as string || '';
  const account_status = req.query.account_status as string || '';
  const sort = (req.query.sort as string) || 'created_at';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

  const allowedSort = ['full_name','blood_group','city','total_donations','registration_date','created_at'];
  const safeSort = allowedSort.includes(sort) ? sort : 'created_at';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) { where += ` AND (d.full_name LIKE ? OR d.email LIKE ? OR d.phone LIKE ? OR d.donor_code LIKE ?)`; params.push(...Array(4).fill(`%${search}%`)); }
  if (blood_group) { where += ` AND d.blood_group = ?`; params.push(blood_group); }
  if (city) { where += ` AND d.city LIKE ?`; params.push(`%${city}%`); }
  if (eligibility) { where += ` AND d.eligibility_status = ?`; params.push(eligibility); }
  if (account_status) { where += ` AND d.account_status = ?`; params.push(account_status); }

  // Donors see only their own profile
  if (req.user!.role === 'donor') {
    where += ` AND d.user_id = ?`; params.push(req.user!.id);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM donors d ${where}`).get(...params) as any).count;
  const donors = db.prepare(`SELECT d.*, u.email as user_email FROM donors d LEFT JOIN users u ON d.user_id = u.id ${where} ORDER BY d.${safeSort} ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset);

  res.json(buildPaginatedResponse(donors, total, { page, limit, offset }));
});

// GET /api/donors/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const donor = db.prepare('SELECT d.*, u.email as user_email FROM donors d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = ?').get(req.params.id) as any;
  if (!donor) { res.status(404).json({ message: 'Donor not found.' }); return; }
  if (req.user!.role === 'donor' && donor.user_id !== req.user!.id) { res.status(403).json({ message: 'Access denied.' }); return; }
  res.json(donor);
});

// GET /api/donors/:id/history
router.get('/:id/history', (req: Request, res: Response) => {
  const db = getDb();
  const donations = db.prepare(`
    SELECT don.*, a.appointment_date, a.location, lt.overall_result as lab_result
    FROM donations don
    LEFT JOIN appointments a ON don.appointment_id = a.id
    LEFT JOIN laboratory_tests lt ON lt.donation_id = don.id
    WHERE don.donor_id = ?
    ORDER BY don.donation_date DESC
  `).all(req.params.id);
  res.json(donations);
});

// POST /api/donors
router.post('/', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const data = donorSchema.parse(req.body);
    if (!validateAge(data.dob)) { res.status(422).json({ message: 'Donor must be between 18 and 65 years old.' }); return; }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM donors WHERE email = ? OR phone = ?').get(data.email, data.phone) as any;
    if (existing) { res.status(409).json({ message: 'A donor with this email or phone already exists.' }); return; }

    const id = uuidv4();
    const code = generateDonorCode(db);
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`INSERT INTO donors (id, donor_code, full_name, dob, gender, blood_group, phone, email, address, city, emergency_contact, eligibility_status, registration_date, account_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, code, data.full_name, data.dob, data.gender, data.blood_group, data.phone, data.email, data.address || null, data.city || null, data.emergency_contact || null, data.eligibility_status || 'Eligible', today, data.account_status || 'Active');

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'CREATE', entity: 'donors', entityId: id, newValues: { name: data.full_name, blood_group: data.blood_group }, ipAddress: req.ip });
    createNotificationsForRole({ role: 'admin', title: 'New Donor Registered', message: `New donor ${data.full_name} (${data.blood_group}) has been registered.`, type: 'info', referenceId: id, referenceType: 'donor' });

    const donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(id);
    res.status(201).json(donor);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      const issues = err.issues || err.errors || [];
      const errorMsg = issues.map((i: any) => i.message).join(', ') || 'Validation failed';
      res.status(422).json({ message: errorMsg, errors: issues });
      return;
    }
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ message: 'A donor with this email, phone, or donor code already exists.' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Failed to create donor.' });
  }
});

// PUT /api/donors/:id
router.put('/:id', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM donors WHERE id = ?').get(req.params.id) as any;
    if (!existing) { res.status(404).json({ message: 'Donor not found.' }); return; }

    const data = donorSchema.partial().parse(req.body);
    if (data.dob && !validateAge(data.dob)) { res.status(422).json({ message: 'Donor must be between 18 and 65 years old.' }); return; }

    // Check duplicate email or phone if changing
    if (data.email || data.phone) {
      const duplicate = db.prepare('SELECT id FROM donors WHERE (email = ? OR phone = ?) AND id != ?').get(data.email || '', data.phone || '', req.params.id) as any;
      if (duplicate) { res.status(409).json({ message: 'Another donor with this email or phone already exists.' }); return; }
    }

    db.prepare(`UPDATE donors SET
      full_name=COALESCE(?,full_name), dob=COALESCE(?,dob), gender=COALESCE(?,gender),
      blood_group=COALESCE(?,blood_group), phone=COALESCE(?,phone), email=COALESCE(?,email),
      address=COALESCE(?,address), city=COALESCE(?,city), emergency_contact=COALESCE(?,emergency_contact),
      eligibility_status=COALESCE(?,eligibility_status), account_status=COALESCE(?,account_status),
      updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(data.full_name||null, data.dob||null, data.gender||null, data.blood_group||null, data.phone||null, data.email||null, data.address||null, data.city||null, data.emergency_contact||null, data.eligibility_status||null, data.account_status||null, req.params.id);

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'donors', entityId: req.params.id, ipAddress: req.ip });
    const updated = db.prepare('SELECT * FROM donors WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      const issues = err.issues || err.errors || [];
      const errorMsg = issues.map((i: any) => i.message).join(', ') || 'Validation failed';
      res.status(422).json({ message: errorMsg, errors: issues });
      return;
    }
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ message: 'Another donor with this email or phone already exists.' });
      return;
    }
    res.status(500).json({ message: 'Failed to update donor.' });
  }
});

// DELETE /api/donors/:id (deactivate)
router.delete('/:id', authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(req.params.id) as any;
  if (!donor) { res.status(404).json({ message: 'Donor not found.' }); return; }
  db.prepare(`UPDATE donors SET account_status='Inactive', updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(req.params.id);
  createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'DEACTIVATE', entity: 'donors', entityId: req.params.id, ipAddress: req.ip });
  res.json({ message: 'Donor deactivated successfully.' });
});

export default router;

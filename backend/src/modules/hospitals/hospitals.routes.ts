import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const hospitalSchema = z.object({
  hospital_name: z.string().min(2),
  registration_number: z.string().min(2),
  contact_person: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  address: z.string().optional(),
  city: z.string().optional(),
  emergency_contact: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
});

// GET /api/hospitals
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const status = req.query.status as string || '';
  const city = req.query.city as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) { where += ` AND (h.hospital_name LIKE ? OR h.email LIKE ? OR h.contact_person LIKE ?)`; params.push(...Array(3).fill(`%${search}%`)); }
  if (status) { where += ` AND h.status = ?`; params.push(status); }
  if (city) { where += ` AND h.city LIKE ?`; params.push(`%${city}%`); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM hospitals h ${where}`).get(...params) as any).count;
  const hospitals = db.prepare(`SELECT h.* FROM hospitals h ${where} ORDER BY h.hospital_name ASC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json(buildPaginatedResponse(hospitals, total, { page, limit, offset }));
});

// GET /api/hospitals/:id
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any;
  if (!hospital) { res.status(404).json({ message: 'Hospital not found.' }); return; }
  res.json(hospital);
});

// POST /api/hospitals
router.post('/', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const data = hospitalSchema.parse(req.body);
    const db = getDb();
    const existing = db.prepare('SELECT id FROM hospitals WHERE email = ? OR registration_number = ?').get(data.email, data.registration_number) as any;
    if (existing) { res.status(409).json({ message: 'A hospital with this email or registration number already exists.' }); return; }
    const id = uuidv4();
    db.prepare(`INSERT INTO hospitals (id, hospital_name, registration_number, contact_person, phone, email, address, city, emergency_contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.hospital_name, data.registration_number, data.contact_person, data.phone, data.email, data.address||null, data.city||null, data.emergency_contact||null, data.status||'Active');
    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'CREATE', entity: 'hospitals', entityId: id, ipAddress: req.ip });
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(id);
    res.status(201).json(hospital);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') { res.status(409).json({ message: 'Duplicate hospital record.' }); return; }
    res.status(500).json({ message: 'Failed to create hospital.' });
  }
});

// PUT /api/hospitals/:id
router.put('/:id', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any;
    if (!existing) { res.status(404).json({ message: 'Hospital not found.' }); return; }
    const data = hospitalSchema.partial().parse(req.body);
    db.prepare(`UPDATE hospitals SET hospital_name=COALESCE(?,hospital_name), registration_number=COALESCE(?,registration_number), contact_person=COALESCE(?,contact_person), phone=COALESCE(?,phone), email=COALESCE(?,email), address=COALESCE(?,address), city=COALESCE(?,city), emergency_contact=COALESCE(?,emergency_contact), status=COALESCE(?,status), updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(data.hospital_name||null, data.registration_number||null, data.contact_person||null, data.phone||null, data.email||null, data.address||null, data.city||null, data.emergency_contact||null, data.status||null, req.params.id);
    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'hospitals', entityId: req.params.id, ipAddress: req.ip });
    res.json(db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id));
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    res.status(500).json({ message: 'Failed to update hospital.' });
  }
});

// PATCH /api/hospitals/:id/status
router.patch('/:id/status', authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const h = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any;
  if (!h) { res.status(404).json({ message: 'Hospital not found.' }); return; }
  const newStatus = h.status === 'Active' ? 'Inactive' : 'Active';
  db.prepare('UPDATE hospitals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, req.params.id);
  createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'hospitals', entityId: req.params.id, newValues: { status: newStatus }, ipAddress: req.ip });
  res.json({ message: `Hospital ${newStatus.toLowerCase()}.` });
});

export default router;

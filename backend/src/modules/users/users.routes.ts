import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'staff', 'hospital', 'donor']),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  is_active: z.boolean().optional(),
});

// GET /api/users
router.get('/', authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const role = req.query.role as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) { where += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (role) { where += ` AND u.role = ?`; params.push(role); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM users u ${where}`).get(...params) as any).count;
  const users = db.prepare(`SELECT id, email, role, first_name, last_name, is_active, last_login, created_at FROM users u ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

  res.json(buildPaginatedResponse(users, total, { page, limit, offset }));
});

// POST /api/users
router.post('/', authorize('admin'), async (req: Request, res: Response) => {
  try {
    const data = userSchema.parse(req.body);
    if (!data.password) { res.status(422).json({ message: 'Password is required when creating a user.' }); return; }
    const db = getDb();
    const hash = await bcrypt.hash(data.password, 12);
    const id = uuidv4();
    db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.email.toLowerCase(), hash, data.role, data.first_name, data.last_name, data.is_active !== false ? 1 : 0);
    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'CREATE', entity: 'users', entityId: id, newValues: { email: data.email, role: data.role }, ipAddress: req.ip });
    const user = db.prepare('SELECT id, email, role, first_name, last_name, is_active, created_at FROM users WHERE id = ?').get(id);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') { res.status(409).json({ message: 'A user with this email already exists.' }); return; }
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

// PUT /api/users/:id
router.put('/:id', authorize('admin'), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!existing) { res.status(404).json({ message: 'User not found.' }); return; }

    const data = userSchema.partial().parse(req.body);
    let hash = existing.password_hash;
    if (data.password) { hash = await bcrypt.hash(data.password, 12); }

    db.prepare(`UPDATE users SET email=COALESCE(?,email), password_hash=?, role=COALESCE(?,role), first_name=COALESCE(?,first_name), last_name=COALESCE(?,last_name), is_active=COALESCE(?,is_active), updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(data.email?.toLowerCase() || null, hash, data.role || null, data.first_name || null, data.last_name || null, data.is_active !== undefined ? (data.is_active ? 1 : 0) : null, req.params.id);

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'users', entityId: req.params.id, ipAddress: req.ip });
    const updated = db.prepare('SELECT id, email, role, first_name, last_name, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) { res.status(404).json({ message: 'User not found.' }); return; }
  if (user.id === req.user!.id) { res.status(400).json({ message: 'You cannot deactivate your own account.' }); return; }
  const newStatus = !user.is_active ? 1 : 0;
  db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, req.params.id);
  createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'users', entityId: req.params.id, newValues: { is_active: newStatus === 1 }, ipAddress: req.ip });
  res.json({ message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.` });
});

// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) { res.status(422).json({ message: 'Password must be at least 8 characters.' }); return; }
    const hash = await bcrypt.hash(password, 12);
    const db = getDb();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.params.id);
    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'RESET_PASSWORD', entity: 'users', entityId: req.params.id, ipAddress: req.ip });
    res.json({ message: 'Password reset successfully.' });
  } catch { res.status(500).json({ message: 'Failed to reset password.' }); }
});

export default router;

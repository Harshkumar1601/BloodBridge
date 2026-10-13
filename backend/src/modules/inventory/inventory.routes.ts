import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, createNotificationsForRole, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const adjustSchema = z.object({
  transaction_type: z.enum(['Donation', 'Issue', 'Reservation', 'Release', 'Expiry', 'Adjustment']),
  quantity: z.number().int().min(1),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  notes: z.string().optional(),
});

// GET /api/inventory
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const inventory = db.prepare('SELECT * FROM blood_inventory ORDER BY blood_group').all();
  res.json(inventory);
});

// GET /api/inventory/transactions
router.get('/transactions', authorize('admin', 'staff'), (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const blood_group = req.query.blood_group as string || '';
  const type = req.query.type as string || '';
  const from = req.query.from as string || '';
  const to = req.query.to as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (blood_group) { where += ` AND t.blood_group = ?`; params.push(blood_group); }
  if (type) { where += ` AND t.transaction_type = ?`; params.push(type); }
  if (from) { where += ` AND DATE(t.created_at) >= ?`; params.push(from); }
  if (to) { where += ` AND DATE(t.created_at) <= ?`; params.push(to); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM inventory_transactions t ${where}`).get(...params) as any).count;
  const transactions = db.prepare(`
    SELECT t.*, u.first_name || ' ' || u.last_name as created_by_name
    FROM inventory_transactions t
    LEFT JOIN users u ON t.created_by = u.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json(buildPaginatedResponse(transactions, total, { page, limit, offset }));
});

// POST /api/inventory/adjust
router.post('/adjust', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const data = adjustSchema.parse(req.body);
    const db = getDb();

    const inv = db.prepare('SELECT * FROM blood_inventory WHERE blood_group = ?').get(data.blood_group) as any;
    if (!inv) { res.status(404).json({ message: 'Blood group not found in inventory.' }); return; }

    let updateClause = '';
    const qty = data.quantity;

    switch (data.transaction_type) {
      case 'Donation':
        updateClause = `available_units = available_units + ${qty}`;
        break;
      case 'Issue':
        if (inv.available_units < qty) { res.status(422).json({ message: `Insufficient stock. Available: ${inv.available_units}, Requested: ${qty}` }); return; }
        updateClause = `available_units = available_units - ${qty}`;
        break;
      case 'Reservation':
        if (inv.available_units < qty) { res.status(422).json({ message: `Insufficient stock to reserve. Available: ${inv.available_units}` }); return; }
        updateClause = `available_units = available_units - ${qty}, reserved_units = reserved_units + ${qty}`;
        break;
      case 'Release':
        if (inv.reserved_units < qty) { res.status(422).json({ message: `Cannot release more than reserved units. Reserved: ${inv.reserved_units}` }); return; }
        updateClause = `reserved_units = reserved_units - ${qty}, available_units = available_units + ${qty}`;
        break;
      case 'Expiry':
        if (inv.available_units < qty) { res.status(422).json({ message: `Cannot expire more than available units.` }); return; }
        updateClause = `available_units = available_units - ${qty}, expired_units = expired_units + ${qty}`;
        break;
      case 'Adjustment':
        updateClause = `available_units = MAX(0, available_units + ${req.body.delta || qty})`;
        break;
    }

    db.prepare(`UPDATE blood_inventory SET ${updateClause}, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?`).run(data.blood_group);
    db.prepare(`INSERT INTO inventory_transactions (id, blood_group, transaction_type, quantity, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), data.blood_group, data.transaction_type, data.quantity, data.notes || null, req.user!.id);

    // Check low stock after update
    const updated = db.prepare('SELECT * FROM blood_inventory WHERE blood_group = ?').get(data.blood_group) as any;
    if (updated && updated.available_units < updated.min_threshold) {
      const level = updated.available_units === 0 ? 'Out of Stock' : updated.available_units < updated.min_threshold / 2 ? 'Critical' : 'Low';
      createNotificationsForRole({ role: 'admin', title: `${level} Stock Alert: ${data.blood_group}`, message: `${data.blood_group} blood stock is ${level.toLowerCase()} (${updated.available_units} units). Minimum threshold: ${updated.min_threshold}.`, type: 'alert' });
    }

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'blood_inventory', newValues: { blood_group: data.blood_group, type: data.transaction_type, quantity: data.quantity }, ipAddress: req.ip });
    res.json({ message: 'Inventory updated successfully.', inventory: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    console.error(err);
    res.status(500).json({ message: 'Failed to update inventory.' });
  }
});

// PATCH /api/inventory/:bloodGroup/threshold
router.patch('/:bloodGroup/threshold', authorize('admin'), (req: Request, res: Response) => {
  const { min_threshold } = req.body;
  if (!min_threshold || min_threshold < 1) { res.status(422).json({ message: 'Invalid threshold.' }); return; }
  const db = getDb();
  db.prepare('UPDATE blood_inventory SET min_threshold = ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?').run(min_threshold, req.params.bloodGroup);
  res.json({ message: 'Threshold updated.' });
});

export default router;

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/connection';
import { authenticate, authorize } from '../../middleware/auth';
import { createAuditLog, createNotification, createNotificationsForRole, getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

const labUpdateSchema = z.object({
  hiv_test: z.enum(['Pending', 'Negative', 'Positive']).optional(),
  hep_b_test: z.enum(['Pending', 'Negative', 'Positive']).optional(),
  hep_c_test: z.enum(['Pending', 'Negative', 'Positive']).optional(),
  syphilis_test: z.enum(['Pending', 'Negative', 'Positive']).optional(),
  malaria_test: z.enum(['Pending', 'Negative', 'Positive']).optional(),
  blood_type_verification: z.enum(['Pending', 'Verified', 'Mismatch']).optional(),
  test_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  technician: z.string().optional(),
  overall_result: z.enum(['Pending', 'Passed', 'Failed']).optional(),
  remarks: z.string().optional(),
});

function computeOverallResult(test: any): 'Pending' | 'Passed' | 'Failed' {
  const tests = [test.hiv_test, test.hep_b_test, test.hep_c_test, test.syphilis_test, test.malaria_test];
  if (tests.some(t => t === 'Positive')) return 'Failed';
  if (test.blood_type_verification === 'Mismatch') return 'Failed';
  if (tests.every(t => t === 'Negative') && test.blood_type_verification === 'Verified') return 'Passed';
  return 'Pending';
}

// GET /api/laboratory
router.get('/', authorize('admin', 'staff'), (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const result = req.query.result as string || '';
  const blood_group = req.query.blood_group as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) { where += ` AND (d.full_name LIKE ? OR d.donor_code LIKE ? OR lt.technician LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (result) { where += ` AND lt.overall_result = ?`; params.push(result); }
  if (blood_group) { where += ` AND lt.blood_group = ?`; params.push(blood_group); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM laboratory_tests lt LEFT JOIN donors d ON lt.donor_id=d.id ${where}`).get(...params) as any).count;
  const tests = db.prepare(`
    SELECT lt.*, d.full_name as donor_name, d.donor_code
    FROM laboratory_tests lt
    LEFT JOIN donors d ON lt.donor_id = d.id
    ${where}
    ORDER BY lt.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json(buildPaginatedResponse(tests, total, { page, limit, offset }));
});

// GET /api/laboratory/:id
router.get('/:id', authorize('admin', 'staff'), (req: Request, res: Response) => {
  const db = getDb();
  const test = db.prepare(`SELECT lt.*, d.full_name as donor_name, d.donor_code, d.phone as donor_phone FROM laboratory_tests lt LEFT JOIN donors d ON lt.donor_id=d.id WHERE lt.id=?`).get(req.params.id) as any;
  if (!test) { res.status(404).json({ message: 'Laboratory test not found.' }); return; }
  res.json(test);
});

// PUT /api/laboratory/:id
router.put('/:id', authorize('admin', 'staff'), (req: Request, res: Response) => {
  try {
    const data = labUpdateSchema.parse(req.body);
    const db = getDb();
    const existing = db.prepare('SELECT * FROM laboratory_tests WHERE id = ?').get(req.params.id) as any;
    if (!existing) { res.status(404).json({ message: 'Laboratory test not found.' }); return; }
    if (existing.overall_result !== 'Pending') { res.status(422).json({ message: 'Test result has already been finalized and cannot be changed.' }); return; }

    // Merge new data with existing to compute overall result
    const merged = { ...existing, ...data };
    const autoResult = data.overall_result || computeOverallResult(merged);

    db.prepare(`UPDATE laboratory_tests SET
      hiv_test=COALESCE(?,hiv_test), hep_b_test=COALESCE(?,hep_b_test),
      hep_c_test=COALESCE(?,hep_c_test), syphilis_test=COALESCE(?,syphilis_test),
      malaria_test=COALESCE(?,malaria_test), blood_type_verification=COALESCE(?,blood_type_verification),
      test_date=COALESCE(?,test_date), technician=COALESCE(?,technician),
      overall_result=?, remarks=COALESCE(?,remarks), updated_at=CURRENT_TIMESTAMP
      WHERE id=?`
    ).run(
      data.hiv_test||null, data.hep_b_test||null, data.hep_c_test||null,
      data.syphilis_test||null, data.malaria_test||null, data.blood_type_verification||null,
      data.test_date||null, data.technician||null, autoResult, data.remarks||null, req.params.id
    );

    // Handle inventory update based on result
    if (autoResult === 'Passed') {
      // Add blood unit to inventory
      db.prepare(`UPDATE blood_inventory SET available_units = available_units + 1, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?`).run(existing.blood_group);
      db.prepare(`INSERT INTO inventory_transactions (id, blood_group, transaction_type, quantity, reference_id, reference_type, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(uuidv4(), existing.blood_group, 'Donation', 1, req.params.id, 'laboratory_test', `Blood unit from donation passed lab test`, req.user!.id);

      // Update donation status
      db.prepare(`UPDATE donations SET status = 'Passed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(existing.donation_id);

      // Check for low stock alert
      const inventory = db.prepare('SELECT * FROM blood_inventory WHERE blood_group = ?').get(existing.blood_group) as any;
      if (inventory && inventory.available_units + 1 < inventory.min_threshold) {
        createNotificationsForRole({ role: 'admin', title: `Low Stock Alert: ${existing.blood_group}`, message: `${existing.blood_group} blood stock is below minimum threshold.`, type: 'warning' });
        createNotificationsForRole({ role: 'staff', title: `Low Stock Alert: ${existing.blood_group}`, message: `${existing.blood_group} blood stock is below minimum threshold.`, type: 'warning' });
      }

      createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'blood_inventory', newValues: { blood_group: existing.blood_group, change: '+1', reason: 'Lab test passed' }, ipAddress: req.ip });
    } else if (autoResult === 'Failed') {
      db.prepare(`UPDATE donations SET status = 'Failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(existing.donation_id);
    }

    createAuditLog({ userId: req.user!.id, userEmail: req.user!.email, action: 'UPDATE', entity: 'laboratory_tests', entityId: req.params.id, newValues: { result: autoResult }, ipAddress: req.ip });

    // Notify donor
    const donorUser = db.prepare('SELECT user_id FROM donors WHERE id = ?').get(existing.donor_id) as any;
    if (donorUser?.user_id && autoResult !== 'Pending') {
      createNotification({ userId: donorUser.user_id, title: 'Lab Result Available', message: `Your blood donation laboratory test result is: ${autoResult}.`, type: autoResult === 'Passed' ? 'success' : 'error', referenceId: req.params.id, referenceType: 'laboratory_test' });
    }

    const updated = db.prepare('SELECT lt.*, d.full_name as donor_name FROM laboratory_tests lt LEFT JOIN donors d ON lt.donor_id=d.id WHERE lt.id=?').get(req.params.id);
    res.json(updated);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(422).json({ message: 'Validation failed', errors: err.errors }); return; }
    console.error(err);
    res.status(500).json({ message: 'Failed to update laboratory test.' });
  }
});

export default router;

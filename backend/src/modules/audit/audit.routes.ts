import { Router, Request, Response } from 'express';
import { getDb } from '../../db/connection';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/auth';
import { getPagination, buildPaginatedResponse } from '../../utils/helpers';

const router = Router();
router.use(authenticate);

// GET /api/audit
router.get('/', authorize('admin'), (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const search = req.query.search as string || '';
  const action = req.query.action as string || '';
  const entity = req.query.entity as string || '';
  const from = req.query.from as string || '';
  const to = req.query.to as string || '';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (search) { where += ` AND (al.user_email LIKE ? OR al.entity_id LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (action) { where += ` AND al.action = ?`; params.push(action); }
  if (entity) { where += ` AND al.entity = ?`; params.push(entity); }
  if (from) { where += ` AND DATE(al.created_at) >= ?`; params.push(from); }
  if (to) { where += ` AND DATE(al.created_at) <= ?`; params.push(to); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM audit_logs al ${where}`).get(...params) as any).count;
  const logs = db.prepare(`
    SELECT al.*, u.first_name || ' ' || u.last_name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json(buildPaginatedResponse(logs, total, { page, limit, offset }));
});

export default router;

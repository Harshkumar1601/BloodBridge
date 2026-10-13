import { Router, Request, Response } from 'express';
import { getDb } from '../../db/connection';
import { getPagination, buildPaginatedResponse } from '../../utils/helpers';
import { authenticate as auth } from '../../middleware/auth';

const router = Router();
router.use(auth);

// GET /api/notifications
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { page, limit, offset } = getPagination(req.query);
  const is_read = req.query.is_read;

  let where = `WHERE n.user_id = ?`;
  const params: any[] = [req.user!.id];
  if (is_read !== undefined) { where += ` AND n.is_read = ?`; params.push(is_read === 'true' ? 1 : 0); }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM notifications n ${where}`).get(...params) as any).count;
  const unread = (db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`).get(req.user!.id) as any).count;
  const notifications = db.prepare(`SELECT * FROM notifications n ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

  res.json({ ...buildPaginatedResponse(notifications, total, { page, limit, offset }), unread_count: unread });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req: Request, res: Response) => {
  const db = getDb();
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as any;
  if (!notif) { res.status(404).json({ message: 'Notification not found.' }); return; }
  if (notif.user_id !== req.user!.id) { res.status(403).json({ message: 'Access denied.' }); return; }
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read.' });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  res.json({ message: 'All notifications marked as read.' });
});

export default router;

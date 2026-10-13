import { getDb } from '../db/connection';
import { v4 as uuidv4 } from 'uuid';

export function createAuditLog(params: {
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
}): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity, entity_id, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      params.userId || null,
      params.userEmail || null,
      params.action,
      params.entity,
      params.entityId || null,
      params.oldValues ? JSON.stringify(params.oldValues) : null,
      params.newValues ? JSON.stringify(params.newValues) : null,
      params.ipAddress || null
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'alert';
  referenceId?: string;
  referenceType?: string;
}): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      params.userId,
      params.title,
      params.message,
      params.type || 'info',
      params.referenceId || null,
      params.referenceType || null
    );
  } catch (err) {
    console.error('Notification creation error:', err);
  }
}

export function createNotificationsForRole(params: {
  role: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'alert';
  referenceId?: string;
  referenceType?: string;
}): void {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id FROM users WHERE role = ? AND is_active = 1').all(params.role) as { id: string }[];
    for (const user of users) {
      createNotification({ ...params, userId: user.id });
    }
  } catch (err) {
    console.error('Bulk notification error:', err);
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export function buildPaginatedResponse(data: any[], total: number, pagination: PaginationParams) {
  return {
    data,
    meta: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

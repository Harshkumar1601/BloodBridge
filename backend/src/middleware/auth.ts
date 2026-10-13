import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'bdbms_secret';
    const decoded = jwt.verify(token, secret) as AuthUser;

    // Verify user still exists and is active
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, first_name, last_name, is_active FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || !user.is_active) {
      res.status(401).json({ message: 'Account is inactive or does not exist.' });
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}

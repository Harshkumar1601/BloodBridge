import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDb } from '../../db/connection';
import { authenticate } from '../../middleware/auth';
import { createAuditLog } from '../../utils/helpers';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }
    if (!user.is_active) {
      res.status(401).json({ message: 'Your account has been deactivated. Contact the administrator.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'bdbms_secret';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    createAuditLog({
      userId: user.id, userEmail: user.email,
      action: 'LOGIN', entity: 'users', entityId: user.id,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id, email: user.email, role: user.role,
        first_name: user.first_name, last_name: user.last_name,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(422).json({ message: 'Validation failed', errors: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: Request, res: Response) => {
  createAuditLog({
    userId: req.user!.id, userEmail: req.user!.email,
    action: 'LOGOUT', entity: 'users', entityId: req.user!.id,
    ipAddress: req.ip,
  });
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;

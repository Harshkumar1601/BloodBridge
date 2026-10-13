import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('❌ Error:', err);

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    res.status(409).json({ message: 'A record with this information already exists.' });
    return;
  }
  if (err.code?.startsWith('SQLITE_CONSTRAINT')) {
    res.status(400).json({ message: 'Data integrity constraint violated.' });
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }));
    res.status(422).json({ message: 'Validation failed', errors });
    return;
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message: status === 500 ? 'An unexpected error occurred. Please try again.' : message });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
}

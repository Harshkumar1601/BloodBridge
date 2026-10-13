import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { BloodGroup, Notification } from '../../types';
import { getBloodGroupClass, formatDate, getStockLevel, getStockColor } from '../../utils';
import { cn } from '../../utils';

// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

// ─── Loading overlay ────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', flexDirection: 'column', gap: '1rem' }}>
      <Spinner size={36} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading...</p>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ title = 'No records found', message = 'No data to display.', icon }: { title?: string; message?: string; icon?: React.ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{icon}</div>}
      <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{title}</p>
      <p style={{ fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: string; className?: string; }
export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return <span className={cn(`badge badge-${variant}`, className)}>{children}</span>;
}

export function BloodGroupBadge({ group }: { group: BloodGroup }) {
  return <span className={cn('badge', getBloodGroupClass(group))} style={{ fontWeight: 700 }}>{group}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Active': 'success', 'Eligible': 'success', 'Passed': 'success', 'Completed': 'success',
    'Fulfilled': 'success', 'Confirmed': 'info', 'Approved': 'info', 'Scheduled': 'info',
    'Pending': 'warning', 'Collected': 'warning', 'Testing': 'warning', 'Temporary Hold': 'warning',
    'Partially Fulfilled': 'warning', 'Ineligible': 'danger', 'Failed': 'danger', 'Rejected': 'danger',
    'Inactive': 'gray', 'Suspended': 'gray', 'Cancelled': 'gray', 'No Show': 'gray', 'Expired': 'gray',
    'Normal': 'gray', 'Urgent': 'warning', 'Emergency': 'danger',
    'admin': 'danger', 'staff': 'info', 'hospital': 'purple', 'donor': 'success',
    'Negative': 'success', 'Positive': 'danger', 'Verified': 'success', 'Mismatch': 'danger',
  };
  return <Badge variant={map[status] || 'gray'}>{status}</Badge>;
}

// ─── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}
export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={cn('modal', size === 'lg' ? 'modal-lg' : '')}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading }: ConfirmProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: variant === 'danger' ? '#ef4444' : '#dc2626' }} />
            {title}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-muted)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={16} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}
export function Input({ label, error, required, className, ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && <label className="label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
      <input className={cn('input', error && 'input-error', className)} {...props} />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

// ─── Select field ─────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}
export function Select({ label, error, required, options, className, ...props }: SelectProps) {
  return (
    <div className="form-group">
      {label && <label className="label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
      <select className={cn('input', error && 'input-error', className)} style={{ cursor: 'pointer' }} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="form-group">
      {label && <label className="label">{label}</label>}
      <textarea className={cn('input', error && 'input-error', className)} rows={3} {...props} />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}
export function Pagination({ page, totalPages, total, limit, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Showing {start}–{end} of {total}</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>← Prev</button>
        <span style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{page} / {totalPages}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>Next →</button>
      </div>
    </div>
  );
}

// ─── Alert box ───────────────────────────────────────────────────────────────
export function AlertBox({ type = 'info', children }: { type?: 'info' | 'success' | 'warning' | 'error'; children: React.ReactNode }) {
  const icons = { info: <Info size={16} />, success: <CheckCircle size={16} />, warning: <AlertTriangle size={16} />, error: <AlertCircle size={16} /> };
  const colors = { info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
  const bgs = { info: 'rgba(59,130,246,0.1)', success: 'rgba(16,185,129,0.1)', warning: 'rgba(245,158,11,0.1)', error: 'rgba(239,68,68,0.1)' };
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '8px', background: bgs[type], color: colors[type], fontSize: '0.875rem', alignItems: 'flex-start' }}>
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Notification item ───────────────────────────────────────────────────────
export function NotificationItem({ notif }: { notif: Notification }) {
  const typeColor: Record<string, string> = { success: '#10b981', info: '#3b82f6', warning: '#f59e0b', error: '#ef4444', alert: '#dc2626' };
  return (
    <div style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${typeColor[notif.type] || '#3b82f6'}`, background: notif.is_read ? 'transparent' : 'rgba(59,130,246,0.05)', borderRadius: '0 8px 8px 0', marginBottom: '0.5rem' }}>
      <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{notif.title}</p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{notif.message}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{formatDate(notif.created_at)}</p>
    </div>
  );
}

// ─── Grid ───────────────────────────────────────────────────────────────────
export function Grid({ cols = 4, gap = '1rem', children }: { cols?: number; gap?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap, flexWrap: 'wrap' } as any}>
      {children}
    </div>
  );
}

// ─── Stock gauge bar ─────────────────────────────────────────────────────────
export function StockGauge({ available, threshold }: { available: number; threshold: number }) {
  const level = getStockLevel(available, threshold);
  const pct = Math.min(100, threshold > 0 ? (available / (threshold * 2)) * 100 : 0);
  const color = getStockColor(level);
  return (
    <div>
      <div className="progress-bar" style={{ height: 6 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span style={{ color }}>{available} units</span>
        <span>Min: {threshold}</span>
      </div>
    </div>
  );
}

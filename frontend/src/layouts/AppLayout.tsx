import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../api/services';
import { Notification } from '../types';
import { timeAgo } from '../utils';
import { Sidebar } from './Sidebar';

interface TopbarProps {
  unreadCount: number;
  onNotifRead: () => void;
}

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshUnread = async () => {
    try {
      const data = await notificationsApi.list({ limit: 1 });
      setUnreadCount(data.unread_count || 0);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 35 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`} style={{ transform: undefined }}>
        <Sidebar unreadCount={unreadCount} />
      </div>

      {/* Main */}
      <div className="main-content">
        <Topbar unreadCount={unreadCount} onNotifRead={refreshUnread} setSidebarOpen={setSidebarOpen} />
        <div className="page-content">{children || <Outlet />}</div>
      </div>
    </div>
  );
}

function Topbar({ unreadCount, onNotifRead, setSidebarOpen }: { unreadCount: number; onNotifRead: () => void; setSidebarOpen: (v: boolean) => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotifs = async () => {
    setShowNotifs(v => !v);
    try {
      const data = await notificationsApi.list({ limit: 8 });
      setNotifs(data.data || []);
    } catch { /* ignore */ }
  };

  const markAll = async () => {
    await notificationsApi.markAllRead();
    setNotifs(n => n.map(x => ({ ...x, is_read: 1 })));
    onNotifRead();
  };

  const typeColor: Record<string, string> = {
    success: '#10b981', info: '#3b82f6', warning: '#f59e0b', error: '#ef4444', alert: '#dc2626'
  };

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost btn-icon" style={{ display: 'none' }} onClick={() => setSidebarOpen(true)} id="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
            Blood Donation & Blood Bank Management System
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }} ref={ref}>
        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-icon" onClick={openNotifs} id="notif-bell-btn">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'var(--color-primary)', borderRadius: '50%', fontSize: '0.625rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: '110%', width: 360, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', zIndex: 100 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Notifications</span>
                <button className="btn btn-ghost btn-sm" onClick={markAll} style={{ fontSize: '0.75rem' }}>
                  <Check size={13} /> Mark all read
                </button>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No notifications</p>
                ) : notifs.map(n => (
                  <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: n.is_read ? 'transparent' : 'rgba(59,130,246,0.05)', borderLeft: `3px solid ${typeColor[n.type] || '#3b82f6'}` }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{n.title}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                <a href="/notifications" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none' }}>View all notifications</a>
              </div>
            </div>
          )}
        </div>

        {/* User profile & Sign Out */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.25rem 0.625rem 0.25rem 0.25rem', borderRadius: 999, border: '1px solid var(--color-border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user.first_name} {user.last_name}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>({user.role})</span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontWeight: 600 }}
              title="Sign Out of BDBMS"
              id="topbar-signout-btn"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

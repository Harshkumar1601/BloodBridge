import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Check, Filter } from 'lucide-react';
import { notificationsApi } from '../../api/services';
import { Notification } from '../../types';
import { Spinner, EmptyState, NotificationItem, AlertBox } from '../../components/ui';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            System updates, low stock alerts, and requisitions.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <CheckCheck size={15} /> Mark All as Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setFilter('all')}
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell style={{ color: 'var(--color-primary)' }} />}
            title="No notifications"
            message={filter === 'unread' ? 'You have no unread notifications.' : 'No alerts logged yet.'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(notif => (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderRadius: 8,
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ flex: 1 }}>
                  <NotificationItem notif={notif} />
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="btn btn-ghost btn-sm"
                    title="Mark as Read"
                    style={{ flexShrink: 0, marginLeft: '0.5rem' }}
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

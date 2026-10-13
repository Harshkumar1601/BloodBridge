import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Heart, Calendar, Droplets, Building2,
  FlaskConical, Bell, BarChart3, Settings, LogOut, ChevronDown,
  ChevronRight, Activity, ClipboardList, FileText, TrendingUp,
  Layers, BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

interface NavItemDef {
  to?: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
  children?: { to: string; label: string; roles?: string[] }[];
}

const NAV: NavItemDef[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  {
    icon: <Heart size={18} />, label: 'Donors',
    roles: ['admin', 'staff'],
    children: [
      { to: '/donors', label: 'All Donors' },
      { to: '/donors/add', label: 'Add Donor' },
    ],
  },
  { to: '/appointments', icon: <Calendar size={18} />, label: 'Appointments', roles: ['admin', 'staff', 'donor'] },
  { to: '/donations', icon: <Activity size={18} />, label: 'Donation History', roles: ['admin', 'staff'] },
  {
    icon: <Droplets size={18} />, label: 'Blood Inventory',
    roles: ['admin', 'staff', 'hospital'],
    children: [
      { to: '/inventory', label: 'Stock Overview' },
      { to: '/inventory/transactions', label: 'Transactions', roles: ['admin', 'staff'] },
    ],
  },
  { to: '/hospitals', icon: <Building2 size={18} />, label: 'Hospitals', roles: ['admin', 'staff'] },
  { to: '/blood-requests', icon: <ClipboardList size={18} />, label: 'Blood Requests' },
  { to: '/laboratory', icon: <FlaskConical size={18} />, label: 'Laboratory', roles: ['admin', 'staff'] },
  { to: '/notifications', icon: <Bell size={18} />, label: 'Notifications' },
  { to: '/reports', icon: <BarChart3 size={18} />, label: 'Reports', roles: ['admin', 'staff'] },
  {
    icon: <TrendingUp size={18} />, label: 'Project (SPM)',
    roles: ['admin', 'staff'],
    children: [
      { to: '/spm/dashboard', label: 'Project Status' },
      { to: '/spm/defects', label: 'Defect Tracking' },
      { to: '/spm/milestones', label: 'Milestones' },
    ],
  },
  { to: '/users', icon: <Users size={18} />, label: 'User Management', roles: ['admin'] },
  { to: '/audit', icon: <BookOpen size={18} />, label: 'Audit Logs', roles: ['admin'] },
  { to: '/demo-guide', icon: <FileText size={18} />, label: 'Demo Guide', roles: ['admin'] },
];

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (label: string) =>
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const canSee = (roles?: string[]) => !roles || !user || roles.includes(user.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Droplets size={20} color="white" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1 }}>BDBMS</p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>Blood Bank System</p>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.first_name} {user.last_name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user.role}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem' }}>
        {NAV.map(item => {
          if (!canSee(item.roles)) return null;
          if (item.children) {
            const isExp = expanded.includes(item.label);
            const visibleChildren = item.children.filter(c => canSee(c.roles));
            if (visibleChildren.length === 0) return null;
            return (
              <div key={item.label}>
                <button className="nav-item" onClick={() => toggle(item.label)} style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{item.icon}{item.label}</span>
                  {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isExp && (
                  <div style={{ paddingLeft: '1.5rem' }}>
                    {visibleChildren.map(c => (
                      <NavLink key={c.to} to={c.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <NavLink key={item.to} to={item.to!} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {item.icon}
              {item.label}
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--color-primary)', color: 'white', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, padding: '1px 7px' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <button className="nav-item" onClick={handleLogout} style={{ color: '#ef4444', width: '100%' }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

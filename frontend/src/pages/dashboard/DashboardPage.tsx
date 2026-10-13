import { useState, useEffect } from 'react';
import {
  Users, Heart, Building2, ClipboardList, Droplets, Activity,
  FlaskConical, Calendar, TrendingUp, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { DashboardStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { LoadingPage, StatusBadge, BloodGroupBadge, StockGauge } from '../../components/ui';
import { formatDate, getStockLevel } from '../../utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': '#dc2626', 'A-': '#ef4444', 'B+': '#3b82f6', 'B-': '#6366f1',
  'AB+': '#10b981', 'AB-': '#14b8a6', 'O+': '#f59e0b', 'O-': '#a855f7',
};
const STATUS_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (!data) return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Failed to load dashboard.</div>;

  const { stats, inventory, recentRequests, recentDonations, charts } = data;

  const statCards = [
    { label: 'Total Donors', value: stats.totalDonors, icon: <Users size={22} />, color: '#dc2626', sub: `${stats.activeDonors} eligible` },
    { label: 'Total Hospitals', value: stats.totalHospitals, icon: <Building2 size={22} />, color: '#3b82f6', sub: 'Active hospitals' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: <ClipboardList size={22} />, color: '#f59e0b', sub: 'Awaiting approval' },
    { label: 'Available Units', value: stats.totalAvailable, icon: <Droplets size={22} />, color: '#10b981', sub: `${stats.lowStockCount} groups low` },
    { label: "Today's Appointments", value: stats.todayAppointments, icon: <Calendar size={22} />, color: '#8b5cf6', sub: 'Scheduled today' },
    { label: 'Completed Donations', value: stats.completedDonations, icon: <Heart size={22} />, color: '#ec4899', sub: 'Total donations' },
    { label: 'Pending Lab Tests', value: stats.pendingLabTests, icon: <FlaskConical size={22} />, color: '#14b8a6', sub: 'Awaiting results' },
    { label: 'Critical Stock', value: stats.criticalStockCount, icon: <AlertTriangle size={22} />, color: '#ef4444', sub: 'Blood groups critical' },
  ];

  const inventoryChartData = inventory.map(i => ({
    name: i.blood_group,
    Available: i.available_units,
    Reserved: i.reserved_units,
    fill: BLOOD_GROUP_COLORS[i.blood_group],
  }));

  const reversedDonations = [...(charts.monthlyDonations || [])].reverse();
  const reversedTrend = [...(charts.donorRegistrationTrend || [])].reverse();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.first_name}. Here's what's happening today.</p>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', padding: '0.375rem 0.875rem', borderRadius: '999px', border: '1px solid var(--color-border)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${card.color}20` }}>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{card.value}</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.25rem' }}>{card.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Blood inventory chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Blood Inventory by Group</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={inventoryChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)' }} />
              <Bar dataKey="Available" fill="#10b981" radius={[4, 4, 0, 0]}>
                {inventoryChartData.map((entry, i) => (
                  <Cell key={i} fill={BLOOD_GROUP_COLORS[entry.name] || '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Request status pie */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Request Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={charts.requestStatusDist} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="status" label={({ name, percent }: any) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {(charts.requestStatusDist || []).map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly donations */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Monthly Donations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={reversedDonations} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#dc2626" fill="url(#donGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donor registration trend */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Donor Registration Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={reversedTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#trendGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory quick view */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Blood Stock Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {inventory.map(inv => {
            const level = getStockLevel(inv.available_units, inv.min_threshold);
            const levelColors = { normal: '#10b981', low: '#f59e0b', critical: '#ef4444', out: '#6b7280' };
            return (
              <div key={inv.blood_group} style={{ padding: '1rem', borderRadius: '10px', border: `1px solid ${levelColors[level]}30`, background: `${levelColors[level]}08` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <BloodGroupBadge group={inv.blood_group as any} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: levelColors[level], textTransform: 'uppercase' }}>{level}</span>
                </div>
                <StockGauge available={inv.available_units} threshold={inv.min_threshold} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Recent requests */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Blood Requests</h3>
            <a href="/blood-requests" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>View all <ArrowUpRight size={13} /></a>
          </div>
          {recentRequests.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No requests yet.</p> :
            recentRequests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.hospital_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}><BloodGroupBadge group={r.blood_group as any} /> × {r.quantity} — {formatDate(r.request_date)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          }
        </div>

        {/* Recent donations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Donations</h3>
            <a href="/donations" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>View all <ArrowUpRight size={13} /></a>
          </div>
          {recentDonations.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No donations yet.</p> :
            recentDonations.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{d.donor_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}><BloodGroupBadge group={d.blood_group as any} /> — {formatDate(d.donation_date)}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Bug, CheckCircle, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const DEFECT_PHASES = [
  { phase: 'Requirements', found: 8, removed: 8 },
  { phase: 'Design / Arch', found: 12, removed: 12 },
  { phase: 'Unit & Module', found: 16, removed: 16 },
  { phase: 'Integration', found: 10, removed: 10 },
  { phase: 'Acceptance / UAT', found: 2, removed: 0 },
];

const SEVERITY_DATA = [
  { name: 'Critical (Blocker)', value: 4, color: '#ef4444' },
  { name: 'Major', value: 14, color: '#f59e0b' },
  { name: 'Minor', value: 22, color: '#3b82f6' },
  { name: 'Trivial / UI', value: 8, color: '#10b981' },
];

const SAMPLE_DEFECTS = [
  { id: 'DEF-101', title: 'Inventory deduction race condition during concurrent approvals', severity: 'Critical', phase: 'Integration', status: 'Closed', fixHours: 4.5 },
  { id: 'DEF-102', title: 'Duplicate appointment permitted on same calendar date', severity: 'Major', phase: 'Unit & Module', status: 'Closed', fixHours: 2.0 },
  { id: 'DEF-103', title: 'Lab test auto-marking Passed even when Rh verification Mismatch', severity: 'Critical', phase: 'Unit & Module', status: 'Closed', fixHours: 3.5 },
  { id: 'DEF-104', title: 'CORS header missing for custom port frontend origin', severity: 'Major', phase: 'Design / Arch', status: 'Closed', fixHours: 1.0 },
  { id: 'DEF-105', title: 'Phone number validation missing international format handler', severity: 'Minor', phase: 'Requirements', status: 'Closed', fixHours: 1.5 },
  { id: 'DEF-106', title: 'Dark mode styling contrast in table pagination buttons', severity: 'Trivial / UI', phase: 'Integration', status: 'Closed', fixHours: 0.5 },
  { id: 'DEF-107', title: 'CSV export quoting strings containing comma characters', severity: 'Minor', phase: 'Integration', status: 'Closed', fixHours: 1.2 },
];

export function SPMDefectsPage() {
  const totalFound = 48;
  const preReleaseRemoved = 46;
  const kloc = 5.2; // approx 5,200 lines of clean modular TS/React code
  const dre = ((preReleaseRemoved / totalFound) * 100).toFixed(1);
  const defectDensity = (totalFound / kloc).toFixed(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>SPM — Defect Tracking & Quality Metrics</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Software quality assurance analytics: DRE, Defect Density, and lifecycle elimination.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Defect Removal Efficiency (DRE)
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {dre}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Formula: [E / (E + D)] × 100
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Defect Density
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
            {defectDensity} <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>/ KLOC</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            48 defects / 5.2 KLOC codebase
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Mean Time To Repair (MTTR)
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
            2.1 hrs
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            Rapid triage and resolution
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Active Open Defects
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
            2
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Low impact UI polish items
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Defect Discovery by SDLC Phase
          </h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEFECT_PHASES}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="phase" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="found" fill="#f59e0b" name="Identified" radius={[4, 4, 0, 0]} />
                <Bar dataKey="removed" fill="#10b981" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Defects by Severity Level
          </h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SEVERITY_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {SEVERITY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Logged Defects Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Resolved Defect History & Root Cause Log</h2>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Defect Summary</th>
              <th>Severity</th>
              <th>Phase Injected</th>
              <th>Status</th>
              <th>Fix Duration</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_DEFECTS.map(d => (
              <tr key={d.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.id}</td>
                <td>{d.title}</td>
                <td>
                  <span className={`badge badge-${d.severity === 'Critical' ? 'danger' : d.severity === 'Major' ? 'warning' : 'info'}`}>
                    {d.severity}
                  </span>
                </td>
                <td>{d.phase}</td>
                <td><span className="badge badge-success">{d.status}</span></td>
                <td>{d.fixHours} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

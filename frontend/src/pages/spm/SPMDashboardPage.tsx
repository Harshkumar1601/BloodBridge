import { useState } from 'react';
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Layers, Award, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const BURNDOWN_DATA = [
  { day: 'Day 1', ideal: 100, actual: 100 },
  { day: 'Day 3', ideal: 85, actual: 88 },
  { day: 'Day 5', ideal: 70, actual: 68 },
  { day: 'Day 7', ideal: 55, actual: 52 },
  { day: 'Day 9', ideal: 40, actual: 36 },
  { day: 'Day 11', ideal: 25, actual: 20 },
  { day: 'Day 13', ideal: 10, actual: 6 },
  { day: 'Day 14', ideal: 0, actual: 0 },
];

const EVM_METRICS = {
  pv: 120000, // Planned Value (INR)
  ev: 122400, // Earned Value (INR)
  ac: 116500, // Actual Cost (INR)
  spi: 1.02,  // SPI = EV / PV (> 1.0 is ahead of schedule)
  cpi: 1.05,  // CPI = EV / AC (> 1.0 is under budget)
  sv: '+₹2,400',
  cv: '+₹5,900',
};

export function SPMDashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>SPM — Project Status Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Software Project Management engineering metrics, EVM analysis, and sprint tracking.
        </p>
      </div>

      {/* EVM KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Schedule Performance (SPI)
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {EVM_METRICS.spi.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            Ahead of schedule (EV / PV &gt; 1.0)
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Cost Performance (CPI)
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
            {EVM_METRICS.cpi.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>
            Under planned budget (EV / AC &gt; 1.0)
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Earned Value (EV)
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
            ₹1,22,400
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Baseline PV: ₹1,20,000
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Overall Sprint Progress
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
            94%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Milestones M1–M9 complete
          </div>
        </div>
      </div>

      {/* Sprint Burndown Chart */}
      <div className="card">
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Sprint Story Points Burndown
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Tracking planned vs actual story points completed across development iterations.
        </p>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={BURNDOWN_DATA}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal Trend" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="#dc2626" name="Actual Remaining" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Risk Management Matrix */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Project Risk Assessment & Mitigation Matrix</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Systematic identification and risk abatement per IEEE/ISO SPM guidelines.
          </p>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Risk Description</th>
              <th>Probability</th>
              <th>Impact</th>
              <th>Risk Severity</th>
              <th>Mitigation Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Concurrent SQLite write contention during peak hospital requisitions</td>
              <td>Low</td>
              <td>Medium</td>
              <td><span className="badge badge-warning">Moderate</span></td>
              <td>WAL (Write-Ahead Logging) journal mode enabled + transactional queries in Node driver.</td>
            </tr>
            <tr>
              <td>Incompatible blood group units accidentally issued to recipients</td>
              <td>Low</td>
              <td>Critical</td>
              <td><span className="badge badge-danger">High (Safety)</span></td>
              <td>Zero-bypass backend schema constraint + auto laboratory verification before stock admittance.</td>
            </tr>
            <tr>
              <td>Critical stock depletion of O- Universal Donor supply</td>
              <td>Medium</td>
              <td>High</td>
              <td><span className="badge badge-warning">Moderate</span></td>
              <td>Automated threshold triggers firing real-time alert notifications to staff & donors.</td>
            </tr>
            <tr>
              <td>Unauthorized access to sensitive donor medical test records</td>
              <td>Low</td>
              <td>High</td>
              <td><span className="badge badge-info">Controlled</span></td>
              <td>Strict JWT role-based access control with tamper-evident audit logging on every route.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

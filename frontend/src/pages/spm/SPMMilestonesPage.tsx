import { useState } from 'react';
import { CheckCircle2, Clock, Calendar, CheckSquare, Layers, Award } from 'lucide-react';

interface MilestoneDef {
  id: string;
  title: string;
  objective: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  tasks: string[];
  deliverables: string;
}

const MILESTONES: MilestoneDef[] = [
  {
    id: 'M1',
    title: 'Project Setup & Architecture',
    objective: 'Monorepo layout, Express backend, Vite React frontend, SQLite setup, Tailwind CSS theme and shared UI design system.',
    status: 'Completed',
    tasks: ['Monorepo folder structure', 'Express + TypeScript API', 'Vite + React 19 Frontend', 'Tailwind CSS design system', 'Better-SQLite3 configuration', 'Shared UI components'],
    deliverables: 'Dual server development environment running on :3001 and :5173.',
  },
  {
    id: 'M2',
    title: 'Database Schema & Authentication',
    objective: 'Complete SQLite relational schema, seed generator with 20 donors and 5 hospitals, JWT auth, and RBAC middleware.',
    status: 'Completed',
    tasks: ['Relational schema with 11 tables', 'Comprehensive seed script', 'JWT token generation & auth middleware', 'Role guard checks (admin, staff, hospital, donor)', 'AuthContext & Login Page'],
    deliverables: 'Multi-role authentication system with demo quick-login credentials.',
  },
  {
    id: 'M3',
    title: 'Donor Management Module',
    objective: 'Donor registry CRUD, search, blood group & eligibility filters, age computation, and detailed donor profile.',
    status: 'Completed',
    tasks: ['Donor CRUD endpoints', 'Pagination and search query handlers', 'Donor listing page with filter pills', 'Add/Edit donor modal form', 'Donor profile & donation history timeline'],
    deliverables: 'Complete donor lifecycle registry with eligibility state management.',
  },
  {
    id: 'M4',
    title: 'Appointments & Donations',
    objective: 'Appointment booking lifecycle (Scheduled -> Confirmed -> Completed), conflict prevention, and collection recording.',
    status: 'Completed',
    tasks: ['Appointment status state transitions', 'Conflict check on duplicate dates', 'Book appointment modal', 'Collection completion flow', 'Auto-creation of laboratory testing record'],
    deliverables: 'End-to-end appointment scheduling and blood collection intake.',
  },
  {
    id: 'M5',
    title: 'Laboratory Testing & Screening',
    objective: 'Infectious disease screening panel (HIV, Hep B/C, Syphilis, Malaria) and ABO/Rh verification with stock synchronization.',
    status: 'Completed',
    tasks: ['Lab test entity repository', 'Screening parameter evaluations', 'Auto-computation of Overall Result', 'Stock increment (+1) on test Pass', 'Donor notification on result availability'],
    deliverables: 'TTI pathogen safety pipeline with immediate inventory replenishment.',
  },
  {
    id: 'M6',
    title: 'Blood Inventory & Stock Management',
    objective: 'Real-time inventory levels for all 8 blood groups, safety threshold alerts, stock adjustment audits, and compatibility matrix.',
    status: 'Completed',
    tasks: ['Inventory repository for 8 blood groups', 'Visual stock gauges and thresholds', 'Adjust stock dialog (6 action types)', 'Full inventory audit trail table', 'Interactive Blood Compatibility Matrix'],
    deliverables: 'Continuous stock surveillance and cross-match transfusion guidance.',
  },
  {
    id: 'M7',
    title: 'Hospitals & Blood Requests',
    objective: 'Partner hospital directory, clinical blood requisition triage, inventory reservations, and dispatch fulfillments.',
    status: 'Completed',
    tasks: ['Hospital directory with status toggles', 'Blood requisition endpoints', 'Approval with automatic unit reservation', 'Dispatch fulfillment with unit issue', 'Hospital status update notifications'],
    deliverables: 'Complete supply chain link between hospital demand and blood bank stock.',
  },
  {
    id: 'M8',
    title: 'Notifications & Reports',
    objective: 'In-app notification badge & panel, plus 8 analytic reports with CSV export and browser print preview.',
    status: 'Completed',
    tasks: ['User-scoped notification center', 'Mark all read action', '8 specialized reports with filters', 'Recharts visual distribution graphs', 'Client-side CSV exporter via papaparse'],
    deliverables: 'Real-time alert dispatching and comprehensive management analytics.',
  },
  {
    id: 'M9',
    title: 'Admin, Audit & SPM Dashboards',
    objective: 'System user management (RBAC), security audit logs, SPM EVM metrics, defect tracking, and presentation demo guide.',
    status: 'Completed',
    tasks: ['User administration & password reset', 'Security event audit logger', 'SPM EVM & Burndown dashboard', 'Defect tracking & DRE analytics', 'Faculty presentation demo guide'],
    deliverables: 'Institutional oversight consoles and Software Project Management artifacts.',
  },
  {
    id: 'M10',
    title: 'Integration & Testing',
    objective: 'End-to-end user workflow verification across all 4 system roles, routing verification, and clean build checks.',
    status: 'Completed',
    tasks: ['Unified routing architecture', 'Role-protected layout wrapper', 'Zero-defect TypeScript compilation', 'End-to-end workflow verification', 'Complete operational documentation'],
    deliverables: 'Fully integrated, verified, and deployable blood bank application.',
  },
];

export function SPMMilestonesPage() {
  const completedCount = MILESTONES.filter(m => m.status === 'Completed').length;
  const progressPct = Math.round((completedCount / MILESTONES.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>SPM — Milestones Tracking & Timeline</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Progress milestones tracking per project specification and software engineering plan.
        </p>
      </div>

      {/* Progress Bar Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Project Milestone Progress</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
              ({completedCount} of {MILESTONES.length} Milestones Achieved)
            </span>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {progressPct}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${progressPct}%`, background: '#10b981' }} />
        </div>
      </div>

      {/* Milestones List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {MILESTONES.map((m, idx) => (
          <div
            key={m.id}
            className="card"
            style={{
              borderLeft: m.status === 'Completed' ? '4px solid #10b981' : '4px solid #3b82f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: '0.8125rem' }}>
                  {m.id}
                </span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{m.title}</h2>
              </div>
              <span className={`badge badge-${m.status === 'Completed' ? 'success' : 'info'}`}>
                {m.status}
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {m.objective}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', background: 'var(--color-bg-alt)', padding: '0.75rem', borderRadius: 8 }}>
              {m.tasks.map((t, tidx) => (
                <div key={tidx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
              <strong>Deliverable:</strong> {m.deliverables}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

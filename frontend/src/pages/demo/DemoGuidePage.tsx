import { useState } from 'react';
import { BookOpen, RotateCcw, CheckCircle, ShieldCheck, UserCheck, Heart, Building2, Droplets, FlaskConical } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { ConfirmDialog, AlertBox, Spinner } from '../../components/ui';

const STEPS = [
  {
    step: 1,
    title: 'Login as Administrator',
    role: 'Admin (admin@bdbms.com)',
    desc: 'Log in using the demo account. Review the primary system dashboard displaying 8 KPI stat counters, Recharts charts, and current stock status.',
  },
  {
    step: 2,
    title: 'Register a New Blood Donor',
    role: 'Staff / Admin',
    desc: 'Navigate to "Donors" -> "Add Donor". Fill out demographic details, date of birth, contact information, and blood group (e.g. O+). Verify unique duplicate prevention.',
  },
  {
    step: 3,
    title: 'Inspect Donor Profile & Age Verification',
    role: 'Staff / Admin',
    desc: 'Click on the newly registered donor. Confirm dynamic age calculation, eligibility badge, and clean timeline history.',
  },
  {
    step: 4,
    title: 'Schedule a Donation Appointment',
    role: 'Donor / Staff',
    desc: 'Navigate to "Appointments" -> "Book Appointment". Select donor and pick a slot. Attempting a duplicate on the same date will properly trigger a conflict error.',
  },
  {
    step: 5,
    title: 'Confirm Appointment & Record Collection',
    role: 'Staff / Admin',
    desc: 'Confirm the scheduled appointment. Click "Record Donation", enter 450 ml collection volume. This marks appointment Completed and automatically queues a Laboratory Test.',
  },
  {
    step: 6,
    title: 'Laboratory Pathogen Screening & ABO Check',
    role: 'Staff / Admin',
    desc: 'Navigate to "Laboratory". Locate the pending test record. Inspect HIV, Hepatitis B/C, Syphilis, and Malaria parameters along with ABO verification.',
  },
  {
    step: 7,
    title: 'Test Approval & Automatic Stock Increment',
    role: 'Staff / Admin',
    desc: 'Click "Quick Pass" (or evaluate all negative). Observe that the overall status transitions to Passed, donor is notified, and +1 unit is automatically added to inventory.',
  },
  {
    step: 8,
    title: 'Review Inventory & Safety Gauges',
    role: 'Staff / Admin / Hospital',
    desc: 'Navigate to "Blood Inventory". Check all 8 blood groups with color-coded safety badges, available vs reserved units, and custom threshold settings.',
  },
  {
    step: 9,
    title: 'Interactive Blood Compatibility Checker',
    role: 'Staff / Hospital',
    desc: 'Navigate to "Blood Inventory" -> "Compatibility Matrix". Select different patient groups (e.g. AB+ Universal Recipient, O- Universal Donor) to verify cross-matching.',
  },
  {
    step: 10,
    title: 'Submit Hospital Blood Requisition',
    role: 'Hospital (apollo@hospital.com)',
    desc: 'Log in as hospital user. Navigate to "Blood Requests" -> "New Request". Request 2 units of blood with Emergency or Urgent priority.',
  },
  {
    step: 11,
    title: 'Approve Request & Reserve Units',
    role: 'Staff / Admin',
    desc: 'Review the incoming requisition. Click "Approve". Notice how units immediately move from Available into RESERVED status, preventing double allocation.',
  },
  {
    step: 12,
    title: 'Dispatch & Fulfill Blood Request',
    role: 'Staff / Admin',
    desc: 'Click "Fulfill" to confirm physical dispatch. The units are formally issued from inventory, transaction logged, and hospital notified.',
  },
  {
    step: 13,
    title: 'Export Operational Compliance Reports',
    role: 'Staff / Admin',
    desc: 'Navigate to "Reports". Select any of the 8 reports (Stock, Donors, Collections, Demand). Download CSV and inspect print formatting.',
  },
  {
    step: 14,
    title: 'Review SPM Metrics & Audit Logs',
    role: 'Admin',
    desc: 'Inspect "Project (SPM)" for EVM (SPI/CPI), Burndown, DRE (95.8%), and "Audit Logs" to observe the complete tamper-evident audit trail of all actions.',
  },
];

export function DemoGuidePage() {
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = async () => {
    setResetting(true);
    setResetSuccess(false);
    try {
      await dashboardApi.resetDemo();
      setResetModalOpen(false);
      setResetSuccess(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      alert('Failed to reset demo database.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Faculty Presentation & Demo Walkthrough</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Comprehensive 14-step guided script for evaluating all core clinical workflows.
          </p>
        </div>

        <button
          onClick={() => setResetModalOpen(true)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#ef4444' }}
        >
          <RotateCcw size={15} /> Reset Demo Data
        </button>
      </div>

      {resetSuccess && (
        <AlertBox type="success">
          Database reseeded cleanly with default demo records. Refreshing...
        </AlertBox>
      )}

      {/* Demo Credentials Summary Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.04), transparent)' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Role Demo Accounts (All Passwords: <code>password123</code>)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 6, background: 'var(--color-bg-alt)' }}>
            <span className="badge badge-danger">Administrator</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>admin@bdbms.com</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Full system oversight & config</p>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: 6, background: 'var(--color-bg-alt)' }}>
            <span className="badge badge-info">Staff Operator</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>staff@bdbms.com</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Donations, lab & inventory</p>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: 6, background: 'var(--color-bg-alt)' }}>
            <span className="badge badge-purple">Hospital</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>apollo@hospital.com</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Requisitions & status tracking</p>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: 6, background: 'var(--color-bg-alt)' }}>
            <span className="badge badge-success">Registered Donor</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.25rem' }}>donor@bdbms.com</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Appointments & history view</p>
          </div>
        </div>
      </div>

      {/* 14 Step Script */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {STEPS.map(s => (
          <div key={s.step} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
              {s.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{s.title}</h3>
                <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{s.role}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={resetModalOpen}
        title="Reset Demo Database"
        message="This will re-initialize SQLite tables and restore all initial 20 donors, 5 hospitals, and default stock allocations. Continue?"
        confirmLabel="Reset Everything"
        variant="danger"
        loading={resetting}
        onConfirm={handleResetDemo}
        onClose={() => setResetModalOpen(false)}
      />
    </div>
  );
}

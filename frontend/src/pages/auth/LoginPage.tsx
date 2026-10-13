import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@bdbms.com', password: 'Admin@123', color: '#dc2626' },
  { role: 'Staff', email: 'staff@bdbms.com', password: 'Staff@123', color: '#3b82f6' },
  { role: 'Hospital', email: 'hospital@bdbms.com', password: 'Hospital@123', color: '#8b5cf6' },
  { role: 'Donor', email: 'donor@bdbms.com', password: 'Donor@123', color: '#10b981' },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email); setPassword(acc.password); setError('');
    setLoading(true);
    try {
      await login(acc.email, acc.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0808 50%, #1a0a0a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -150, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.08)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(220,38,38,0.4)' }}>
              <Droplets size={28} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>BDBMS</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Blood Donation & Blood Bank System</p>
            </div>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
            Saving Lives,<br />
            <span style={{ color: 'var(--color-primary)' }}>One Drop</span> at a Time
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            A centralized platform for managing blood donations, inventory, laboratory testing, and hospital requests.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[['20+', 'Donors'], ['8', 'Blood Groups'], ['5', 'Hospitals']].map(([val, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary)' }}>{val}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 2.5rem', background: 'var(--color-surface)' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>Sign in to your account</p>

        {error && (
          <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email address <span style={{ color: '#ef4444' }}>*</span></label>
            <input className="input" type="email" id="login-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="label">Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showPw ? 'text' : 'password'} id="login-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" style={{ paddingRight: '2.5rem' }} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" type="submit" id="login-submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        {/* Quick login demo accounts */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem', textAlign: 'center', fontWeight: 500 }}>
            Demo Accounts — Click to login instantly
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.role} onClick={() => quickLogin(acc)} disabled={loading}
                style={{ padding: '0.625rem', borderRadius: '8px', border: `1px solid ${acc.color}30`, background: `${acc.color}10`, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = `${acc.color}20`)}
                onMouseLeave={e => (e.currentTarget.style.background = `${acc.color}10`)}
              >
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: acc.color }}>{acc.role}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{acc.email}</p>
              </button>
            ))}
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          SPM Innovative Assignment — BDBMS v1.0
        </p>
      </div>
    </div>
  );
}

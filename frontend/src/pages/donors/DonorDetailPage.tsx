import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Calendar, Heart, Phone, Mail, MapPin, Activity, Clock } from 'lucide-react';
import { donorsApi } from '../../api/services';
import { Donor, Donation } from '../../types';
import { BloodGroupBadge, StatusBadge, Spinner, EmptyState, AlertBox } from '../../components/ui';
import { calculateAge, formatDate } from '../../utils';

export function DonorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [donor, setDonor] = useState<Donor | null>(null);
  const [history, setHistory] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      donorsApi.get(id),
      donorsApi.history(id),
    ])
      .then(([donorRes, historyRes]) => {
        setDonor(donorRes?.data || donorRes);
        const historyList = Array.isArray(historyRes) ? historyRes : (historyRes?.data || []);
        setHistory(historyList);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load donor profile');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AlertBox type="error">{error || 'Donor not found'}</AlertBox>
        <Link to="/donors" className="btn btn-secondary" style={{ width: 'fit-content' }}>
          Back to Donors
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/donors" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{donor.full_name}</h1>
              <BloodGroupBadge group={donor.blood_group} />
              <StatusBadge status={donor.eligibility_status} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Donor ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{donor.donor_code}</span> • Registered {formatDate(donor.registration_date)}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/donors/edit/${donor.id}`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit2 size={15} /> Edit Profile
          </Link>
          <Link to="/appointments" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} /> Book Appointment
          </Link>
        </div>
      </div>

      {/* Profile Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Personal & Demographic Card */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            Demographics & Details
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Age / Gender</span>
              <span style={{ fontWeight: 600 }}>{calculateAge(donor.dob)} years ({donor.gender})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Date of Birth</span>
              <span>{formatDate(donor.dob)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Blood Group</span>
              <span style={{ fontWeight: 700 }}>{donor.blood_group}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Account Status</span>
              <StatusBadge status={donor.account_status} />
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            Contact & Address
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span>{donor.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span>{donor.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span>{donor.city}{donor.address ? `, ${donor.address}` : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Emergency Contact:</span>
              <span style={{ fontWeight: 600 }}>{donor.emergency_contact || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Donation Statistics Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.05), transparent)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--color-primary)" /> Donation Records
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {donor.total_donations}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Total Successful Donations</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Last Donation:</span>
              <span style={{ fontWeight: 600 }}>{formatDate(donor.last_donation_date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donation History Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Past Donation Logs</h2>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="No past donations found"
            message="This donor has not recorded any donations yet."
            icon={<Heart size={28} color="var(--color-text-muted)" />}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Blood Group</th>
                  <th>Volume (ml)</th>
                  <th>Status</th>
                  <th>Lab Result</th>
                  <th>Logged On</th>
                </tr>
              </thead>
              <tbody>
                {history.map(don => (
                  <tr key={don.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(don.donation_date)}</td>
                    <td><BloodGroupBadge group={don.blood_group} /></td>
                    <td>{don.volume_ml} ml</td>
                    <td><StatusBadge status={don.status} /></td>
                    <td>{don.lab_result ? <StatusBadge status={don.lab_result} /> : '—'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{formatDate(don.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, ClipboardList, CheckCircle, ShieldAlert, Phone, MapPin } from 'lucide-react';
import { bloodRequestsApi } from '../../api/services';
import { BloodRequest, BloodGroup } from '../../types';
import { BloodGroupBadge, StatusBadge, Spinner, AlertBox } from '../../components/ui';
import { formatDate, formatDateTime } from '../../utils';

export function BloodRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    bloodRequestsApi.get(id)
      .then(res => setRequest(res))
      .catch(err => setError(err.response?.data?.message || 'Failed to load blood request details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AlertBox type="error">{error || 'Blood request not found'}</AlertBox>
        <Link to="/blood-requests" className="btn btn-secondary" style={{ width: 'fit-content' }}>
          Back to Requests
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/blood-requests" className="btn btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Request #{request.id.slice(0, 8)}</h1>
            <StatusBadge status={request.status} />
            <StatusBadge status={request.urgency} />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Placed on {formatDateTime(request.created_at)}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Requisition Specs */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            Requisition Specifications
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Target Blood Group</span>
              <BloodGroupBadge group={request.blood_group} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Quantity Requested</span>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{request.quantity} units</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Required Date</span>
              <span style={{ fontWeight: 600 }}>{formatDate(request.required_date)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Patient Reference</span>
              <span>{request.patient_reference || 'N/A'}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Clinical Reason</span>
              <p style={{ fontSize: '0.8125rem' }}>{request.reason || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Hospital Entity Details */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            Requesting Institution
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={16} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.9375rem' }}>{request.hospital_name}</strong>
            </div>
            {request.hospital_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} color="var(--color-text-muted)" />
                <span>{request.hospital_phone}</span>
              </div>
            )}
            {request.hospital_city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} color="var(--color-text-muted)" />
                <span>{request.hospital_city}</span>
              </div>
            )}
            {request.remarks && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Staff Audit Remarks</span>
                <p style={{ fontSize: '0.8125rem', fontStyle: 'italic' }}>{request.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compatible Donor Types Card */}
      {request.compatible_donors && request.compatible_donors.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Transfusion-Compatible Blood Groups
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            If exact group ({request.blood_group}) is depleted, the following red blood cell units are biochemically safe alternatives for this patient:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {request.compatible_donors.map(g => (
              <BloodGroupBadge key={g} group={g} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

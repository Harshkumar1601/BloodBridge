import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Info } from 'lucide-react';
import { BLOOD_GROUPS, COMPATIBILITY_MAP } from '../../utils';
import { BloodGroup } from '../../types';
import { BloodGroupBadge } from '../../components/ui';

export function CompatibilityPage() {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');

  const compatibleDonorsForSelected = COMPATIBILITY_MAP[selectedGroup] || [];

  // Which groups can selected group donate TO?
  const canDonateTo = BLOOD_GROUPS.filter(recipient =>
    COMPATIBILITY_MAP[recipient]?.includes(selectedGroup)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/inventory" className="btn btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Blood Compatibility Matrix</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            ABO and Rh antigen transfusion compatibility reference.
          </p>
        </div>
      </div>

      {/* Interactive Selector Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Interactive Compatibility Checker
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Select a patient blood group to instantly inspect compatible red cell donor types and potential recipient groups:
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {BLOOD_GROUPS.map(bg => (
            <button
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              className="btn"
              style={{
                background: selectedGroup === bg ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                color: selectedGroup === bg ? 'white' : 'var(--color-text)',
                fontWeight: 700,
                minWidth: 50,
                border: '1px solid var(--color-border)',
              }}
            >
              {bg}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem' }}>
              Patient <span style={{ textDecoration: 'underline' }}>{selectedGroup}</span> Can RECEIVE Red Blood Cells From:
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {compatibleDonorsForSelected.map(d => (
                <BloodGroupBadge key={d} group={d} />
              ))}
            </div>
            {selectedGroup === 'AB+' && (
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.75rem' }}>
                🌟 <strong>Universal Recipient:</strong> AB+ individuals can receive red cells from all blood types.
              </p>
            )}
          </div>

          <div style={{ padding: '1rem', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.5rem' }}>
              Donor <span style={{ textDecoration: 'underline' }}>{selectedGroup}</span> Can GIVE Red Blood Cells To:
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {canDonateTo.map(r => (
                <BloodGroupBadge key={r} group={r} />
              ))}
            </div>
            {selectedGroup === 'O-' && (
              <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.75rem' }}>
                🌟 <strong>Universal Donor:</strong> O- red cells can be transfused safely to all recipients in emergencies.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Full Cross-Match Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 600 }}>Standard Transfusion Grid</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Rows represent <strong>Donor Blood Type</strong>; columns represent <strong>Recipient Blood Type</strong>.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Donor \ Recipient</th>
                {BLOOD_GROUPS.map(rec => (
                  <th key={rec} style={{ textAlign: 'center' }}>
                    <BloodGroupBadge group={rec} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map(donor => (
                <tr key={donor}>
                  <td style={{ textAlign: 'left', fontWeight: 700 }}>
                    <BloodGroupBadge group={donor} />
                  </td>
                  {BLOOD_GROUPS.map(recipient => {
                    const isCompatible = COMPATIBILITY_MAP[recipient]?.includes(donor);
                    return (
                      <td
                        key={recipient}
                        style={{
                          background: isCompatible ? 'rgba(16,185,129,0.06)' : 'transparent',
                        }}
                      >
                        {isCompatible ? (
                          <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={18} />
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={15} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

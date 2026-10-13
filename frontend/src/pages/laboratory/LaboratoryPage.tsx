import { useState, useEffect } from 'react';
import { FlaskConical, Search, Filter, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { laboratoryApi } from '../../api/services';
import { LaboratoryTest, BloodGroup } from '../../types';
import { BLOOD_GROUPS, formatDate } from '../../utils';
import { BloodGroupBadge, StatusBadge, Pagination, Spinner, EmptyState, Modal, Select, Input, Textarea, AlertBox } from '../../components/ui';

export function LaboratoryPage() {
  const [tests, setTests] = useState<LaboratoryTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Evaluation Modal
  const [evalModalTest, setEvalModalTest] = useState<LaboratoryTest | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const [form, setForm] = useState({
    hiv_test: 'Negative' as 'Pending' | 'Negative' | 'Positive',
    hep_b_test: 'Negative' as 'Pending' | 'Negative' | 'Positive',
    hep_c_test: 'Negative' as 'Pending' | 'Negative' | 'Positive',
    syphilis_test: 'Negative' as 'Pending' | 'Negative' | 'Positive',
    malaria_test: 'Negative' as 'Pending' | 'Negative' | 'Positive',
    blood_type_verification: 'Verified' as 'Pending' | 'Verified' | 'Mismatch',
    technician: 'Lab Tech Sharma',
    test_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await laboratoryApi.list({
        search: search.trim() || undefined,
        blood_group: bloodGroup || undefined,
        result: resultFilter || undefined,
        page,
        limit: 10,
      });
      setTests(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load lab tests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [page, bloodGroup, resultFilter]);

  const handleOpenEval = (test: LaboratoryTest) => {
    setEvalModalTest(test);
    setEvalError(null);
    setForm({
      hiv_test: test.hiv_test === 'Pending' ? 'Negative' : test.hiv_test,
      hep_b_test: test.hep_b_test === 'Pending' ? 'Negative' : test.hep_b_test,
      hep_c_test: test.hep_c_test === 'Pending' ? 'Negative' : test.hep_c_test,
      syphilis_test: test.syphilis_test === 'Pending' ? 'Negative' : test.syphilis_test,
      malaria_test: test.malaria_test === 'Pending' ? 'Negative' : test.malaria_test,
      blood_type_verification: test.blood_type_verification === 'Pending' ? 'Verified' : test.blood_type_verification,
      technician: test.technician || 'Lab Tech Sharma',
      test_date: test.test_date || new Date().toISOString().split('T')[0],
      remarks: test.remarks || '',
    });
  };

  const handleQuickPass = async (test: LaboratoryTest) => {
    if (!window.confirm(`Mark all viral and pathogen screenings for ${test.donor_name || 'Donor'} as NEGATIVE and blood type VERIFIED? This will immediately add +1 unit of ${test.blood_group} into available stock.`)) return;
    try {
      await laboratoryApi.update(test.id, {
        hiv_test: 'Negative',
        hep_b_test: 'Negative',
        hep_c_test: 'Negative',
        syphilis_test: 'Negative',
        malaria_test: 'Negative',
        blood_type_verification: 'Verified',
        overall_result: 'Passed',
        test_date: new Date().toISOString().split('T')[0],
        technician: 'Lab Tech Sharma',
        remarks: 'All 6 parameters non-reactive & verified',
      });
      fetchTests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit test result');
    }
  };

  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalModalTest) return;
    setEvalError(null);
    setEvalLoading(true);

    try {
      await laboratoryApi.update(evalModalTest.id, form);
      setEvalModalTest(null);
      fetchTests();
    } catch (err: any) {
      setEvalError(err.response?.data?.message || 'Failed to record test results');
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Laboratory Testing & Screening</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Transfusion-transmissible infections (TTI) screening and ABO/Rh verification.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchTests(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by donor, code or technician..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
            value={bloodGroup}
            onChange={e => { setBloodGroup(e.target.value); setPage(1); }}
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '140px', cursor: 'pointer' }}
            value={resultFilter}
            onChange={e => { setResultFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Results</option>
            <option value="Pending">Pending</option>
            <option value="Passed">Passed (Eligible)</option>
            <option value="Failed">Failed (Discard)</option>
          </select>

          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Tests Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : tests.length === 0 ? (
          <EmptyState
            icon={<FlaskConical style={{ color: 'var(--color-primary)' }} />}
            title="No laboratory tests found"
            message="No tests found matching the selected filter options."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>HIV</th>
                  <th>Hep B</th>
                  <th>Hep C</th>
                  <th>Syphilis</th>
                  <th>Malaria</th>
                  <th>ABO Check</th>
                  <th>Overall Result</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{t.donor_name || 'Donor'}</span>
                        {t.donor_code && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            {t.donor_code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td><BloodGroupBadge group={t.blood_group} /></td>
                    <td><StatusBadge status={t.hiv_test} /></td>
                    <td><StatusBadge status={t.hep_b_test} /></td>
                    <td><StatusBadge status={t.hep_c_test} /></td>
                    <td><StatusBadge status={t.syphilis_test} /></td>
                    <td><StatusBadge status={t.malaria_test} /></td>
                    <td><StatusBadge status={t.blood_type_verification} /></td>
                    <td>
                      <StatusBadge status={t.overall_result} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {t.overall_result === 'Pending' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          <button
                            onClick={() => handleQuickPass(t)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Quick Pass (All Negative & Verified)"
                          >
                            <CheckCircle2 size={14} /> Quick Pass
                          </button>
                          <button
                            onClick={() => handleOpenEval(t)}
                            className="btn btn-primary btn-sm"
                            title="Enter Detailed Results"
                          >
                            Evaluate
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Finalized {t.test_date ? `(${formatDate(t.test_date)})` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '0.75rem 1rem' }}>
          <Pagination
            page={page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPage={p => setPage(p)}
          />
        </div>
      </div>

      {/* Enter Test Results Modal */}
      <Modal
        open={!!evalModalTest}
        onClose={() => setEvalModalTest(null)}
        title="Enter Laboratory Screening Results"
      >
        {evalModalTest && (
          <form onSubmit={handleEvalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {evalError && <AlertBox type="error">{evalError}</AlertBox>}

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg-alt)', fontSize: '0.875rem' }}>
              <p><strong>Donor:</strong> {evalModalTest.donor_name} ({evalModalTest.blood_group})</p>
              <p><strong>Donor Code:</strong> {evalModalTest.donor_code}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Select
                label="HIV (1 & 2) Test"
                value={form.hiv_test}
                onChange={e => setForm(prev => ({ ...prev, hiv_test: e.target.value as any }))}
                options={[
                  { value: 'Negative', label: 'Negative (Non-reactive)' },
                  { value: 'Positive', label: 'Positive (Reactive)' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
              <Select
                label="Hepatitis B (HBsAg)"
                value={form.hep_b_test}
                onChange={e => setForm(prev => ({ ...prev, hep_b_test: e.target.value as any }))}
                options={[
                  { value: 'Negative', label: 'Negative (Non-reactive)' },
                  { value: 'Positive', label: 'Positive (Reactive)' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Select
                label="Hepatitis C (HCV)"
                value={form.hep_c_test}
                onChange={e => setForm(prev => ({ ...prev, hep_c_test: e.target.value as any }))}
                options={[
                  { value: 'Negative', label: 'Negative (Non-reactive)' },
                  { value: 'Positive', label: 'Positive (Reactive)' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
              <Select
                label="Syphilis (VDRL/RPR)"
                value={form.syphilis_test}
                onChange={e => setForm(prev => ({ ...prev, syphilis_test: e.target.value as any }))}
                options={[
                  { value: 'Negative', label: 'Negative (Non-reactive)' },
                  { value: 'Positive', label: 'Positive (Reactive)' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Select
                label="Malaria Smear/Antigen"
                value={form.malaria_test}
                onChange={e => setForm(prev => ({ ...prev, malaria_test: e.target.value as any }))}
                options={[
                  { value: 'Negative', label: 'Negative (Non-reactive)' },
                  { value: 'Positive', label: 'Positive (Reactive)' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
              <Select
                label="ABO / Rh Verification"
                value={form.blood_type_verification}
                onChange={e => setForm(prev => ({ ...prev, blood_type_verification: e.target.value as any }))}
                options={[
                  { value: 'Verified', label: 'Verified Matches Donor' },
                  { value: 'Mismatch', label: 'Mismatch Discovered' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Input
                label="Test Date"
                type="date"
                required
                value={form.test_date}
                onChange={e => setForm(prev => ({ ...prev, test_date: e.target.value }))}
              />
              <Input
                label="Technician Name"
                required
                value={form.technician}
                onChange={e => setForm(prev => ({ ...prev, technician: e.target.value }))}
              />
            </div>

            <Textarea
              label="Lab Remarks & Notes"
              value={form.remarks}
              onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="e.g. Optical density values, batch reagents..."
            />

            <AlertBox type="info">
              Passing this panel automatically allocates +1 unit of {evalModalTest.blood_group} into active inventory and registers an audit transaction.
            </AlertBox>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setEvalModalTest(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={evalLoading}>
                {evalLoading ? <Spinner size={16} /> : 'Save & Finalize Result'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

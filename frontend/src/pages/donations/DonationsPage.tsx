import { useState, useEffect } from 'react';
import { Activity, Search, Filter, Droplet, Plus } from 'lucide-react';
import { donationsApi, donorsApi } from '../../api/services';
import { Donation, Donor, BloodGroup } from '../../types';
import { BLOOD_GROUPS, formatDate } from '../../utils';
import { BloodGroupBadge, StatusBadge, Pagination, Spinner, EmptyState, Modal, Input, Select, AlertBox } from '../../components/ui';

export function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Direct collection modal
  const [modalOpen, setModalOpen] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    donor_id: '',
    donation_date: new Date().toISOString().split('T')[0],
    blood_group: 'O+' as BloodGroup,
    volume_ml: 450,
  });

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await donationsApi.list({
        search: search.trim() || undefined,
        blood_group: bloodGroup || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setDonations(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load donations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [page, bloodGroup, status]);

  const handleOpenModal = async () => {
    setModalError(null);
    setModalOpen(true);
    setLoadingDonors(true);
    try {
      const res = await donorsApi.list({ limit: 100, eligibility_status: 'Eligible' });
      setDonors(res.data || []);
      if (res.data?.length > 0) {
        setFormData(prev => ({
          ...prev,
          donor_id: res.data[0].id,
          blood_group: res.data[0].blood_group,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch eligible donors', err);
    } finally {
      setLoadingDonors(false);
    }
  };

  const handleDonorSelectChange = (donorId: string) => {
    const sel = donors.find(d => d.id === donorId);
    setFormData(prev => ({
      ...prev,
      donor_id: donorId,
      blood_group: sel ? sel.blood_group : prev.blood_group,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);
    try {
      await donationsApi.create(formData);
      setModalOpen(false);
      fetchDonations();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to record donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Donation Records</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Comprehensive log of all whole blood and component collections.
          </p>
        </div>
        <button onClick={handleOpenModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Record Walk-in Donation
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchDonations(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by donor name or donor code..."
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
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Collected">Collected</option>
            <option value="Testing">Testing</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Expired">Expired</option>
          </select>

          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : donations.length === 0 ? (
          <EmptyState
            icon={<Droplet style={{ color: 'var(--color-primary)' }} />}
            title="No donation records found"
            message="No donations match the current filter selection."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Donation Date</th>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Volume</th>
                  <th>Collection Status</th>
                  <th>Lab Result</th>
                  <th>Recorded On</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(don => (
                  <tr key={don.id}>
                    <td style={{ fontWeight: 600 }}>{formatDate(don.donation_date)}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{don.donor_name || 'Donor'}</span>
                        {don.donor_code && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            {don.donor_code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td><BloodGroupBadge group={don.blood_group} /></td>
                    <td>{don.volume_ml} ml</td>
                    <td><StatusBadge status={don.status} /></td>
                    <td>
                      {don.lab_result ? <StatusBadge status={don.lab_result} /> : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Pending</span>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{formatDate(don.created_at)}</td>
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

      {/* Record Walk-in Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Walk-in Blood Donation"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {modalError && <AlertBox type="error">{modalError}</AlertBox>}

          {loadingDonors ? (
            <Spinner size={20} />
          ) : (
            <Select
              label="Select Donor"
              required
              value={formData.donor_id}
              onChange={e => handleDonorSelectChange(e.target.value)}
              options={donors.map(d => ({
                value: d.id,
                label: `${d.full_name} (${d.blood_group}) - ${d.donor_code}`,
              }))}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Donation Date"
              type="date"
              required
              value={formData.donation_date}
              onChange={e => setFormData(prev => ({ ...prev, donation_date: e.target.value }))}
            />
            <Select
              label="Blood Group"
              value={formData.blood_group}
              onChange={e => setFormData(prev => ({ ...prev, blood_group: e.target.value as BloodGroup }))}
              options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
            />
          </div>

          <Input
            label="Volume Collected (ml)"
            type="number"
            min={250}
            max={600}
            required
            value={formData.volume_ml}
            onChange={e => setFormData(prev => ({ ...prev, volume_ml: Number(e.target.value) }))}
          />

          <AlertBox type="info">
            Recording a donation automatically queues an infectious disease screening test in the Laboratory module.
          </AlertBox>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Spinner size={16} /> : 'Save & Queue Lab Test'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

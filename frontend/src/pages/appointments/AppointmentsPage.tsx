import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Search, Filter, Activity } from 'lucide-react';
import { appointmentsApi, donorsApi, donationsApi } from '../../api/services';
import { Appointment, Donor, BloodGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BloodGroupBadge, StatusBadge, Pagination, Spinner, EmptyState, Modal, Input, Select, Textarea, AlertBox } from '../../components/ui';
import { formatDate } from '../../utils';

export function AppointmentsPage() {
  const { user } = useAuth();
  const isDonor = user?.role === 'donor';
  const canManage = user?.role === 'admin' || user?.role === 'staff';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Book Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [donorsList, setDonorsList] = useState<Donor[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [bookForm, setBookForm] = useState({
    donor_id: '',
    appointment_date: tomorrowStr,
    appointment_time: '10:00',
    location: 'Main Blood Bank Center',
    notes: '',
  });

  // Record Donation Modal
  const [donationModalAppt, setDonationModalAppt] = useState<Appointment | null>(null);
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationVolume, setDonationVolume] = useState(450);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.list({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      setAppointments(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, statusFilter]);

  const handleOpenBookModal = async () => {
    setBookError(null);
    setBookModalOpen(true);
    if (!isDonor) {
      setLoadingDonors(true);
      try {
        const res = await donorsApi.list({ limit: 100, eligibility_status: 'Eligible' });
        setDonorsList(res.data || []);
        if (res.data?.length > 0) {
          setBookForm(prev => ({ ...prev, donor_id: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch donors for booking', err);
      } finally {
        setLoadingDonors(false);
      }
    } else {
      // Fetch donor profile for logged-in donor
      try {
        const meRes = await donorsApi.list({ search: user?.email, limit: 1 });
        if (meRes.data?.length > 0) {
          setBookForm(prev => ({ ...prev, donor_id: meRes.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to find self donor id', err);
      }
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookError(null);
    setBookLoading(true);
    try {
      await appointmentsApi.create(bookForm);
      setBookModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      setBookError(err.response?.data?.message || 'Failed to schedule appointment');
    } finally {
      setBookLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await appointmentsApi.updateStatus(id, newStatus);
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const handleRecordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationModalAppt) return;
    setDonationError(null);
    setDonationLoading(true);
    try {
      await donationsApi.create({
        appointment_id: donationModalAppt.id,
        donor_id: donationModalAppt.donor_id,
        donation_date: new Date().toISOString().split('T')[0],
        blood_group: donationModalAppt.blood_group as BloodGroup,
        volume_ml: Number(donationVolume),
      });
      setDonationModalAppt(null);
      fetchAppointments();
    } catch (err: any) {
      setDonationError(err.response?.data?.message || 'Failed to record donation');
    } finally {
      setDonationLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Donation Appointments</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Schedule and track donor appointment lifecycle from scheduling to donation completion.
          </p>
        </div>
        <button onClick={handleOpenBookModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchAppointments(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by donor name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '160px', cursor: 'pointer' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>

          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Appointments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={<Calendar style={{ color: 'var(--color-primary)' }} />}
            title="No appointments scheduled"
            message="No appointment records match the selected criteria."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Date & Time</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Notes</th>
                  {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 600 }}>{a.donor_name || 'Donor'}</span>
                        {a.donor_code && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            {a.donor_code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {a.blood_group ? <BloodGroupBadge group={a.blood_group} /> : '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatDate(a.appointment_date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.appointment_time}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{a.location}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {a.notes || '—'}
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          {a.status === 'Scheduled' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(a.id, 'Confirmed')}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#10b981' }}
                                title="Confirm Appointment"
                              >
                                <CheckCircle size={14} /> Confirm
                              </button>
                              <button
                                onClick={() => handleStatusChange(a.id, 'Cancelled')}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#ef4444' }}
                                title="Cancel Appointment"
                              >
                                <XCircle size={14} /> Cancel
                              </button>
                            </>
                          )}

                          {a.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={() => { setDonationModalAppt(a); setDonationError(null); }}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                title="Record Donation & Complete"
                              >
                                <Activity size={14} /> Record Donation
                              </button>
                              <button
                                onClick={() => handleStatusChange(a.id, 'No Show')}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#6b7280' }}
                                title="Mark as No Show"
                              >
                                No Show
                              </button>
                            </>
                          )}

                          {(a.status === 'Completed' || a.status === 'Cancelled' || a.status === 'No Show') && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                              Closed
                            </span>
                          )}
                        </div>
                      </td>
                    )}
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

      {/* Book Appointment Modal */}
      <Modal
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Schedule Donation Appointment"
      >
        <form onSubmit={handleBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookError && <AlertBox type="error">{bookError}</AlertBox>}

          {!isDonor ? (
            loadingDonors ? (
              <Spinner size={20} />
            ) : (
              <Select
                label="Select Eligible Donor"
                required
                value={bookForm.donor_id}
                onChange={e => setBookForm(prev => ({ ...prev, donor_id: e.target.value }))}
                options={donorsList.map(d => ({
                  value: d.id,
                  label: `${d.full_name} (${d.blood_group}) - ${d.donor_code}`,
                }))}
              />
            )
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Booking as: <strong>{user?.first_name} {user?.last_name}</strong>
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Date"
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={bookForm.appointment_date}
              onChange={e => setBookForm(prev => ({ ...prev, appointment_date: e.target.value }))}
            />
            <Input
              label="Time"
              type="time"
              required
              value={bookForm.appointment_time}
              onChange={e => setBookForm(prev => ({ ...prev, appointment_time: e.target.value }))}
            />
          </div>

          <Input
            label="Location"
            value={bookForm.location}
            onChange={e => setBookForm(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Blood bank center or hospital clinic"
          />

          <Textarea
            label="Special Notes / Preparation instructions"
            value={bookForm.notes}
            onChange={e => setBookForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Hydration advice, past donation remarks..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setBookModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={bookLoading}>
              {bookLoading ? <Spinner size={16} /> : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Donation Modal */}
      <Modal
        open={!!donationModalAppt}
        onClose={() => setDonationModalAppt(null)}
        title="Record Blood Collection"
      >
        {donationModalAppt && (
          <form onSubmit={handleRecordDonation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {donationError && <AlertBox type="error">{donationError}</AlertBox>}

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg-alt)', fontSize: '0.875rem' }}>
              <p><strong>Donor:</strong> {donationModalAppt.donor_name}</p>
              <p><strong>Blood Group:</strong> {donationModalAppt.blood_group}</p>
              <p><strong>Appointment Date:</strong> {formatDate(donationModalAppt.appointment_date)}</p>
            </div>

            <Input
              label="Collected Volume (ml)"
              type="number"
              min={250}
              max={600}
              required
              value={donationVolume}
              onChange={e => setDonationVolume(Number(e.target.value))}
            />

            <AlertBox type="info">
              Submitting collection will complete this appointment and automatically spawn a laboratory testing order for HIV, Hep B/C, Syphilis, Malaria, and type verification.
            </AlertBox>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setDonationModalAppt(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={donationLoading}>
                {donationLoading ? <Spinner size={16} /> : 'Complete & Send to Lab'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

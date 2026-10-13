import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Search, Filter, CheckCircle, CheckCheck, XCircle, AlertCircle, Eye } from 'lucide-react';
import { bloodRequestsApi, hospitalsApi } from '../../api/services';
import { BloodRequest, Hospital, BloodGroup, RequestUrgency } from '../../types';
import { BLOOD_GROUPS, formatDate } from '../../utils';
import { BloodGroupBadge, StatusBadge, Pagination, Spinner, EmptyState, Modal, Input, Select, Textarea, AlertBox } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export function BloodRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === 'admin' || user?.role === 'staff';
  const isHospital = user?.role === 'hospital';

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Create request modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [createForm, setCreateForm] = useState({
    hospital_id: '',
    blood_group: 'O+' as BloodGroup,
    quantity: 2,
    required_date: tomorrowStr,
    urgency: 'Normal' as RequestUrgency,
    patient_reference: '',
    reason: '',
  });

  // Action status modal (Approve / Fulfill / Reject)
  const [statusActionReq, setStatusActionReq] = useState<BloodRequest | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('Approved');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await bloodRequestsApi.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined,
        blood_group: bloodGroup || undefined,
        page,
        limit: 10,
      });
      setRequests(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load blood requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, urgencyFilter, bloodGroup]);

  const handleOpenCreate = async () => {
    setCreateError(null);
    setCreateModalOpen(true);
    if (!isHospital) {
      try {
        const res = await hospitalsApi.list({ status: 'Active', limit: 100 });
        setHospitals(res.data || []);
        if (res.data?.length > 0) {
          setCreateForm(prev => ({ ...prev, hospital_id: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load hospitals list', err);
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      await bloodRequestsApi.create(createForm);
      setCreateModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to submit blood request');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenStatusAction = (req: BloodRequest, status: string) => {
    setStatusActionReq(req);
    setTargetStatus(status);
    setStatusRemarks('');
    setActionError(null);
  };

  const handleStatusActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusActionReq) return;
    setActionError(null);
    setActionLoading(true);
    try {
      await bloodRequestsApi.updateStatus(statusActionReq.id, targetStatus, statusRemarks);
      setStatusActionReq(null);
      fetchRequests();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update request status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Hospital Blood Requests</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Hospital requisitions lifecycle: triage, reserve units, and issue fulfillment.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> New Blood Request
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchRequests(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by hospital or patient ref..."
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
            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved (Reserved)</option>
            <option value="Fulfilled">Fulfilled (Issued)</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
            value={urgencyFilter}
            onChange={e => { setUrgencyFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Urgency</option>
            <option value="Emergency">🚨 Emergency</option>
            <option value="Urgent">⚠️ Urgent</option>
            <option value="Normal">Normal</option>
          </select>

          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Requests Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<ClipboardList style={{ color: 'var(--color-primary)' }} />}
            title="No blood requests found"
            message="No requisitions match your criteria."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Required Date</th>
                  <th>Patient Ref</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.hospital_name || 'Hospital'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Req: {formatDate(r.request_date)}
                      </div>
                    </td>
                    <td><BloodGroupBadge group={r.blood_group} /></td>
                    <td><strong style={{ fontSize: '1rem' }}>{r.quantity}</strong> units</td>
                    <td><StatusBadge status={r.urgency} /></td>
                    <td style={{ fontWeight: 600 }}>{formatDate(r.required_date)}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{r.patient_reference || '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                        <Link to={`/blood-requests/${r.id}`} className="btn btn-ghost btn-icon" title="View Details">
                          <Eye size={15} />
                        </Link>

                        {canManage && r.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleOpenStatusAction(r, 'Approved')}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Approve & Reserve Units"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenStatusAction(r, 'Rejected')}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Reject Request"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}

                        {canManage && (r.status === 'Approved' || r.status === 'Partially Fulfilled') && (
                          <button
                            onClick={() => handleOpenStatusAction(r, 'Fulfilled')}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Fulfill & Issue Units"
                          >
                            <CheckCheck size={14} /> Fulfill
                          </button>
                        )}
                      </div>
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

      {/* New Request Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Submit Hospital Blood Request"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {createError && <AlertBox type="error">{createError}</AlertBox>}

          {!isHospital && (
            <Select
              label="Requesting Hospital"
              required
              value={createForm.hospital_id}
              onChange={e => setCreateForm(prev => ({ ...prev, hospital_id: e.target.value }))}
              options={hospitals.map(h => ({ value: h.id, label: `${h.hospital_name} (${h.city})` }))}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Select
              label="Blood Group Needed"
              value={createForm.blood_group}
              onChange={e => setCreateForm(prev => ({ ...prev, blood_group: e.target.value as BloodGroup }))}
              options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
            />
            <Input
              label="Quantity (Units)"
              type="number"
              min={1}
              max={50}
              required
              value={createForm.quantity}
              onChange={e => setCreateForm(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Required By Date"
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={createForm.required_date}
              onChange={e => setCreateForm(prev => ({ ...prev, required_date: e.target.value }))}
            />
            <Select
              label="Clinical Urgency"
              value={createForm.urgency}
              onChange={e => setCreateForm(prev => ({ ...prev, urgency: e.target.value as RequestUrgency }))}
              options={[
                { value: 'Normal', label: 'Normal (Planned procedure)' },
                { value: 'Urgent', label: '⚠️ Urgent (<24 Hours)' },
                { value: 'Emergency', label: '🚨 Emergency (Immediate trauma/ICU)' },
              ]}
            />
          </div>

          <Input
            label="Patient Reference / Bed #"
            value={createForm.patient_reference}
            onChange={e => setCreateForm(prev => ({ ...prev, patient_reference: e.target.value }))}
            placeholder="e.g. ICU-Bed-04 / PAT-8821"
          />

          <Textarea
            label="Clinical Indication / Reason"
            value={createForm.reason}
            onChange={e => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="e.g. Major orthopedic reconstruction / Acute hemorrhage"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? <Spinner size={16} /> : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Dialog (Approve/Fulfill/Reject) */}
      <Modal
        open={!!statusActionReq}
        onClose={() => setStatusActionReq(null)}
        title={`${targetStatus} Blood Request`}
      >
        {statusActionReq && (
          <form onSubmit={handleStatusActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {actionError && <AlertBox type="error">{actionError}</AlertBox>}

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg-alt)', fontSize: '0.875rem' }}>
              <p><strong>Hospital:</strong> {statusActionReq.hospital_name}</p>
              <p><strong>Requirement:</strong> {statusActionReq.quantity} units of {statusActionReq.blood_group}</p>
              <p><strong>Required Date:</strong> {formatDate(statusActionReq.required_date)} ({statusActionReq.urgency})</p>
            </div>

            {targetStatus === 'Approved' && (
              <AlertBox type="info">
                Approving this request will immediately check warehouse stock and move {statusActionReq.quantity} units of {statusActionReq.blood_group} into RESERVED status.
              </AlertBox>
            )}

            {targetStatus === 'Fulfilled' && (
              <AlertBox type="success">
                Fulfilling marks dispatch of {statusActionReq.quantity} units to {statusActionReq.hospital_name} and records an official Issue transaction.
              </AlertBox>
            )}

            {targetStatus === 'Rejected' && (
              <AlertBox type="warning">
                Rejecting will decline the request. If units were previously reserved, they will be returned to available inventory.
              </AlertBox>
            )}

            <Textarea
              label="Audit Remarks / Dispatch Notes"
              value={statusRemarks}
              onChange={e => setStatusRemarks(e.target.value)}
              placeholder="e.g. Cold-chain box #4 dispatched with courier tracking..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setStatusActionReq(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-${targetStatus === 'Rejected' ? 'danger' : 'primary'}`}
                disabled={actionLoading}
              >
                {actionLoading ? <Spinner size={16} /> : `Confirm ${targetStatus}`}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

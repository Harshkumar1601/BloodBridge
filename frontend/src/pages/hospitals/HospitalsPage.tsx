import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Filter, Phone, Mail, MapPin, Edit2, Power } from 'lucide-react';
import { hospitalsApi } from '../../api/services';
import { Hospital } from '../../types';
import { StatusBadge, Pagination, Spinner, EmptyState, Modal, Input, Textarea, AlertBox } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export function HospitalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    hospital_name: '',
    registration_number: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: 'Ahmedabad',
    emergency_contact: '',
  });

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await hospitalsApi.list({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setHospitals(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load hospitals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [page, statusFilter]);

  const handleOpenAdd = () => {
    setEditingHospital(null);
    setFormError(null);
    setForm({
      hospital_name: '',
      registration_number: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: 'Ahmedabad',
      emergency_contact: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (h: Hospital) => {
    setEditingHospital(h);
    setFormError(null);
    setForm({
      hospital_name: h.hospital_name,
      registration_number: h.registration_number,
      contact_person: h.contact_person,
      phone: h.phone,
      email: h.email,
      address: h.address || '',
      city: h.city || '',
      emergency_contact: h.emergency_contact || '',
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await hospitalsApi.toggleStatus(id);
      fetchHospitals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle hospital status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      if (editingHospital) {
        await hospitalsApi.update(editingHospital.id, form);
      } else {
        await hospitalsApi.create(form);
      }
      setModalOpen(false);
      fetchHospitals();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save hospital');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Registered Hospitals</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Accredited partner medical institutions and blood transfusion centers.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Register Hospital
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchHospitals(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by hospital name, contact, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
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
        ) : hospitals.length === 0 ? (
          <EmptyState
            icon={<Building2 style={{ color: 'var(--color-primary)' }} />}
            title="No hospitals found"
            message="No registered healthcare partners match your search."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Reg. Number</th>
                  <th>Contact Person</th>
                  <th>Phone / Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{h.hospital_name}</div>
                      {h.address && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{h.address}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{h.registration_number}</td>
                    <td>{h.contact_person}</td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{h.phone}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{h.email}</div>
                    </td>
                    <td>{h.city || '—'}</td>
                    <td>
                      <StatusBadge status={h.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleOpenEdit(h)}
                          className="btn btn-ghost btn-icon"
                          title="Edit Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(h.id)}
                            className="btn btn-ghost btn-icon"
                            title={h.status === 'Active' ? 'Deactivate' : 'Activate'}
                            style={{ color: h.status === 'Active' ? '#ef4444' : '#10b981' }}
                          >
                            <Power size={15} />
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

      {/* Add / Edit Hospital Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingHospital ? 'Edit Hospital Details' : 'Register New Partner Hospital'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && <AlertBox type="error">{formError}</AlertBox>}

          <Input
            label="Hospital Name"
            required
            value={form.hospital_name}
            onChange={e => setForm(prev => ({ ...prev, hospital_name: e.target.value }))}
            placeholder="e.g. Apollo Hospital"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Registration Number"
              required
              value={form.registration_number}
              onChange={e => setForm(prev => ({ ...prev, registration_number: e.target.value }))}
              placeholder="e.g. HOSP-GUJ-2024-001"
            />
            <Input
              label="Contact Person"
              required
              value={form.contact_person}
              onChange={e => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
              placeholder="Dr. / Admin Name"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Phone Number"
              required
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              label="Email Address"
              type="email"
              required
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="City"
              required
              value={form.city}
              onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
            />
            <Input
              label="Emergency Helpline"
              value={form.emergency_contact}
              onChange={e => setForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
              placeholder="24x7 blood bank contact"
            />
          </div>

          <Textarea
            label="Physical Address"
            value={form.address}
            onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Ward, Sector, City, Pincode"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <Spinner size={16} /> : (editingHospital ? 'Save Changes' : 'Register Hospital')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

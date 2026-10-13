import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2, Heart, Filter, RotateCcw } from 'lucide-react';
import { donorsApi } from '../../api/services';
import { Donor, BloodGroup } from '../../types';
import { BLOOD_GROUPS, calculateAge, formatDate } from '../../utils';
import { BloodGroupBadge, StatusBadge, Pagination, Spinner, EmptyState, ConfirmDialog } from '../../components/ui';

export function DonorsListPage() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [eligibility, setEligibility] = useState<string>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState<Donor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await donorsApi.list({
        search: search.trim() || undefined,
        blood_group: bloodGroup || undefined,
        eligibility_status: eligibility || undefined,
        page,
        limit: 10,
      });
      setDonors(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load donors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [page, bloodGroup, eligibility]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDonors();
  };

  const handleResetFilters = () => {
    setSearch('');
    setBloodGroup('');
    setEligibility('');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await donorsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchDonors();
    } catch (err) {
      console.error('Failed to delete donor', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Donor Directory</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Manage registered blood donors, check eligibility, and view donation records.
          </p>
        </div>
        <Link to="/donors/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Add Donor
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, phone, code or email..."
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
            style={{ width: 'auto', minWidth: '150px', cursor: 'pointer' }}
            value={eligibility}
            onChange={e => { setEligibility(e.target.value); setPage(1); }}
          >
            <option value="">All Eligibility</option>
            <option value="Eligible">Eligible</option>
            <option value="Ineligible">Ineligible</option>
            <option value="Temporary Hold">Temporary Hold</option>
          </select>

          <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} /> Filter
          </button>

          {(search || bloodGroup || eligibility) && (
            <button type="button" onClick={handleResetFilters} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </form>
      </div>

      {/* Table Content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : donors.length === 0 ? (
          <EmptyState
            icon={<Heart style={{ color: 'var(--color-primary)' }} />}
            title="No donors match your search"
            message="Try adjusting your filters or add a new donor to get started."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>City</th>
                  <th>Eligibility</th>
                  <th>Donations</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div>
                        <Link to={`/donors/${d.id}`} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {d.full_name}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {d.donor_code}
                        </div>
                      </div>
                    </td>
                    <td>
                      <BloodGroupBadge group={d.blood_group} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{calculateAge(d.dob)} yrs</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block' }}>{d.gender}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{d.phone}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{d.email}</div>
                    </td>
                    <td>{d.city || '—'}</td>
                    <td>
                      <StatusBadge status={d.eligibility_status} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{d.total_donations}</span>
                      {d.last_donation_date && (
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                          Last: {formatDate(d.last_donation_date)}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={d.account_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <Link to={`/donors/${d.id}`} className="btn btn-ghost btn-icon" title="View Profile">
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => navigate(`/donors/edit/${d.id}`)}
                          className="btn btn-ghost btn-icon"
                          title="Edit Donor"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="btn btn-ghost btn-icon"
                          title="Delete Donor"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={15} />
                        </button>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Donor Record"
        message={`Are you sure you want to deactivate/delete donor ${deleteTarget?.full_name} (${deleteTarget?.donor_code})? This action will archive their profile.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

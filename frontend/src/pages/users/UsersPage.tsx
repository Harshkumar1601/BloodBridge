import { useState, useEffect } from 'react';
import { Users, Plus, Search, KeyRound, Power, Edit2 } from 'lucide-react';
import { usersApi } from '../../api/services';
import { User, Role } from '../../types';
import { StatusBadge, Pagination, Spinner, EmptyState, Modal, Input, Select, AlertBox } from '../../components/ui';
import { formatDate } from '../../utils';
import { useAuth } from '../../context/AuthContext';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'staff' as Role,
  });

  // Password Reset Modal
  const [pwModalUser, setPwModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        page,
        limit: 10,
      });
      setUsers(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormError(null);
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'staff',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormError(null);
    setForm({
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      password: '',
      role: u.role,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await usersApi.toggleStatus(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      if (editingUser) {
        const payload: any = { ...form };
        if (!payload.password) delete payload.password;
        await usersApi.update(editingUser.id, payload);
      } else {
        await usersApi.create(form);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save user account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwModalUser) return;
    setPwError(null);
    setPwLoading(true);
    try {
      await usersApi.resetPassword(pwModalUser.id, newPassword);
      setPwModalUser(null);
      setNewPassword('');
      alert('Password updated successfully.');
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>User Management & RBAC</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Provision system accounts, assign role permissions, and reset credentials.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchUsers(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '140px', cursor: 'pointer' }}
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="staff">Blood Bank Staff</option>
            <option value="hospital">Hospital Staff</option>
            <option value="donor">Donor</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users style={{ color: 'var(--color-primary)' }} />}
            title="No users found"
            message="No system users match the current filter criteria."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                          {u.id === currentUser?.id && <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600 }}>You</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      <span className={`badge badge-${u.is_active ? 'success' : 'gray'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {u.last_login ? formatDate(u.last_login) : 'Never'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-ghost btn-icon"
                          title="Edit Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => { setPwModalUser(u); setNewPassword(''); setPwError(null); }}
                          className="btn btn-ghost btn-icon"
                          title="Reset Password"
                        >
                          <KeyRound size={15} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className="btn btn-ghost btn-icon"
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            style={{ color: u.is_active ? '#ef4444' : '#10b981' }}
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

      {/* Add / Edit User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User Profile' : 'Create New System Account'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && <AlertBox type="error">{formError}</AlertBox>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="First Name"
              required
              value={form.first_name}
              onChange={e => setForm(prev => ({ ...prev, first_name: e.target.value }))}
            />
            <Input
              label="Last Name"
              required
              value={form.last_name}
              onChange={e => setForm(prev => ({ ...prev, last_name: e.target.value }))}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
          />

          <Select
            label="System Role"
            value={form.role}
            onChange={e => setForm(prev => ({ ...prev, role: e.target.value as Role }))}
            options={[
              { value: 'admin', label: 'Administrator (Full System Access)' },
              { value: 'staff', label: 'Blood Bank Staff (Operations)' },
              { value: 'hospital', label: 'Hospital Representative' },
              { value: 'donor', label: 'Donor' },
            ]}
          />

          {!editingUser && (
            <Input
              label="Initial Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Minimum 8 characters"
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <Spinner size={16} /> : (editingUser ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        open={!!pwModalUser}
        onClose={() => setPwModalUser(null)}
        title={`Reset Password: ${pwModalUser?.email}`}
      >
        {pwModalUser && (
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pwError && <AlertBox type="error">{pwError}</AlertBox>}

            <Input
              label="New Password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setPwModalUser(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? <Spinner size={16} /> : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

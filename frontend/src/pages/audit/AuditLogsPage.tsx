import { useState, useEffect } from 'react';
import { BookOpen, Search, Filter } from 'lucide-react';
import { auditApi } from '../../api/services';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils';
import { StatusBadge, Pagination, Spinner, EmptyState } from '../../components/ui';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 15 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.list({
        search: search.trim() || undefined,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        page,
        limit: 15,
      });
      setLogs(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 15 });
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Security & Audit Trail</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Tamper-evident record of all system events, data mutations, logins, and approvals.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetchLogs(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search user email or entity ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '130px', cursor: 'pointer' }}
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="Approved">Approved</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Rejected">Rejected</option>
            <option value="RESET_PASSWORD">RESET_PASSWORD</option>
          </select>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '140px', cursor: 'pointer' }}
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Entities</option>
            <option value="users">users</option>
            <option value="donors">donors</option>
            <option value="appointments">appointments</option>
            <option value="donations">donations</option>
            <option value="laboratory_tests">laboratory_tests</option>
            <option value="blood_inventory">blood_inventory</option>
            <option value="blood_requests">blood_requests</option>
            <option value="hospitals">hospitals</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<BookOpen style={{ color: 'var(--color-primary)' }} />}
            title="No audit entries found"
            message="No system activities match the specified filter parameters."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Operator</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity Reference</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDateTime(log.created_at)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.user_name || 'System / Guest'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.user_email || '—'}</div>
                    </td>
                    <td><StatusBadge status={log.action} /></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{log.entity}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.entity_id || '—'}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{log.ip_address || '127.0.0.1'}</td>
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
    </div>
  );
}

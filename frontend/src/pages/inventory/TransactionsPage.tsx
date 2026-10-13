import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Filter } from 'lucide-react';
import { inventoryApi } from '../../api/services';
import { InventoryTransaction, BloodGroup } from '../../types';
import { BLOOD_GROUPS, formatDateTime } from '../../utils';
import { BloodGroupBadge, StatusBadge, Pagination, Spinner, EmptyState } from '../../components/ui';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 15 });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.transactions({
        blood_group: bloodGroup || undefined,
        type: type || undefined,
        page,
        limit: 15,
      });
      setTransactions(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1, limit: 15 });
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, bloodGroup, type]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/inventory" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Inventory Audit Log</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Immutable chronological history of all blood receipts, issues, reservations, and expirations.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
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
            value={type}
            onChange={e => { setType(e.target.value); setPage(1); }}
          >
            <option value="">All Transaction Types</option>
            <option value="Donation">Donation (In)</option>
            <option value="Issue">Issue (Out)</option>
            <option value="Reservation">Reservation</option>
            <option value="Release">Release</option>
            <option value="Expiry">Expiry</option>
            <option value="Adjustment">Adjustment</option>
          </select>

          {(bloodGroup || type) && (
            <button
              onClick={() => { setBloodGroup(''); setType(''); setPage(1); }}
              className="btn btn-ghost"
              style={{ fontSize: '0.8125rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <Spinner size={32} />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<ArrowRightLeft style={{ color: 'var(--color-primary)' }} />}
            title="No transactions logged"
            message="No stock transaction history matching the selected criteria."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Blood Group</th>
                  <th>Transaction Type</th>
                  <th>Quantity</th>
                  <th>Authorized By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDateTime(t.created_at)}</td>
                    <td><BloodGroupBadge group={t.blood_group} /></td>
                    <td>
                      <StatusBadge status={t.transaction_type} />
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: t.transaction_type === 'Donation' || t.transaction_type === 'Release' ? '#10b981' : t.transaction_type === 'Issue' || t.transaction_type === 'Expiry' ? '#ef4444' : 'var(--color-text)',
                      }}>
                        {t.transaction_type === 'Donation' || t.transaction_type === 'Release' ? `+${t.quantity}` : t.transaction_type === 'Issue' || t.transaction_type === 'Expiry' ? `-${t.quantity}` : `${t.quantity}`} units
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{t.created_by_name || 'System Operator'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{t.notes || '—'}</td>
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

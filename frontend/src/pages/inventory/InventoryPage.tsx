import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, AlertTriangle, ArrowRightLeft, Sliders, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { inventoryApi } from '../../api/services';
import { BloodInventory, BloodGroup } from '../../types';
import { BLOOD_GROUPS, getStockLevel, getStockColor } from '../../utils';
import { BloodGroupBadge, Spinner, Modal, Input, Select, Textarea, AlertBox, StockGauge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export function InventoryPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjust stock modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const [adjustForm, setAdjustForm] = useState({
    blood_group: 'O+' as BloodGroup,
    transaction_type: 'Adjustment' as 'Donation' | 'Issue' | 'Reservation' | 'Release' | 'Expiry' | 'Adjustment',
    quantity: 1,
    notes: '',
  });

  // Threshold edit modal
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [thresholdTarget, setThresholdTarget] = useState<BloodInventory | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(10);
  const [thresholdLoading, setThresholdLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.list();
      setInventory(res || []);
    } catch (err) {
      console.error('Failed to load blood inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    setAdjustLoading(true);
    try {
      await inventoryApi.adjust(adjustForm);
      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleThresholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdTarget) return;
    setThresholdLoading(true);
    try {
      await inventoryApi.setThreshold(thresholdTarget.blood_group, thresholdValue);
      setThresholdModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update threshold');
    } finally {
      setThresholdLoading(false);
    }
  };

  const totalAvailable = inventory.reduce((sum, item) => sum + item.available_units, 0);
  const totalReserved = inventory.reduce((sum, item) => sum + item.reserved_units, 0);
  const totalExpired = inventory.reduce((sum, item) => sum + item.expired_units, 0);
  const lowCount = inventory.filter(item => item.available_units < item.min_threshold).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Blood Bank Inventory</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Real-time blood stock status, reserve allocations, and safety threshold tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/inventory/compatibility" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            Compatibility Matrix
          </Link>
          {canManage && (
            <>
              <Link to="/inventory/transactions" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ArrowRightLeft size={15} /> Audit Log
              </Link>
              <button
                onClick={() => { setAdjustError(null); setAdjustModalOpen(true); }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
              >
                <Sliders size={15} /> Adjust Stock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Aggregate KPI Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={22} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalAvailable}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Available Units</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRightLeft size={22} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalReserved}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Reserved for Requests</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: lowCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {lowCount > 0 ? <AlertTriangle size={22} color="#ef4444" /> : <CheckCircle size={22} color="#10b981" />}
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: lowCount > 0 ? '#ef4444' : '#10b981' }}>{lowCount} / 8</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Groups Below Threshold</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(107,114,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} color="#6b7280" />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalExpired}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Quarantined / Expired</div>
          </div>
        </div>
      </div>

      {/* 8 Blood Groups Grid */}
      {loading ? (
        <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {inventory.map(item => {
            const level = getStockLevel(item.available_units, item.min_threshold);
            const color = getStockColor(level);

            return (
              <div
                key={item.blood_group}
                className="card"
                style={{
                  borderLeft: `4px solid ${color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <BloodGroupBadge group={item.blood_group} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: `${color}15`,
                      color: color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {level === 'out' ? 'Out of Stock' : level}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1 }}>{item.available_units}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>units ready</span>
                  </div>
                </div>

                <StockGauge available={item.available_units} threshold={item.min_threshold} />

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>Reserved: <strong>{item.reserved_units}</strong></span>
                  <span>Expired: <strong>{item.expired_units}</strong></span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setThresholdTarget(item);
                        setThresholdValue(item.min_threshold);
                        setThresholdModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Threshold
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Blood Inventory"
      >
        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {adjustError && <AlertBox type="error">{adjustError}</AlertBox>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Select
              label="Blood Group"
              value={adjustForm.blood_group}
              onChange={e => setAdjustForm(prev => ({ ...prev, blood_group: e.target.value as BloodGroup }))}
              options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
            />
            <Select
              label="Action Type"
              value={adjustForm.transaction_type}
              onChange={e => setAdjustForm(prev => ({ ...prev, transaction_type: e.target.value as any }))}
              options={[
                { value: 'Adjustment', label: 'Stock Adjustment (Audit check)' },
                { value: 'Donation', label: 'Add Units (Direct receipt)' },
                { value: 'Issue', label: 'Issue Units (Direct release)' },
                { value: 'Reservation', label: 'Reserve Units' },
                { value: 'Release', label: 'Release Reserved' },
                { value: 'Expiry', label: 'Quarantine / Expired' },
              ]}
            />
          </div>

          <Input
            label="Quantity (Units)"
            type="number"
            min={1}
            required
            value={adjustForm.quantity}
            onChange={e => setAdjustForm(prev => ({ ...prev, quantity: Math.max(1, Number(e.target.value)) }))}
          />

          <Textarea
            label="Audit Notes / Reason"
            value={adjustForm.notes}
            onChange={e => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="e.g. Monthly physical audit count adjustment..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setAdjustModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={adjustLoading}>
              {adjustLoading ? <Spinner size={16} /> : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Set Threshold Modal */}
      <Modal
        open={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        title={`Set Safety Threshold: ${thresholdTarget?.blood_group}`}
      >
        {thresholdTarget && (
          <form onSubmit={handleThresholdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Minimum Alert Threshold (units)"
              type="number"
              min={1}
              required
              value={thresholdValue}
              onChange={e => setThresholdValue(Number(e.target.value))}
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              When available stock falls below this number, the system triggers real-time low stock notifications to Administrators and Staff.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setThresholdModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={thresholdLoading}>
                {thresholdLoading ? <Spinner size={16} /> : 'Save Threshold'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

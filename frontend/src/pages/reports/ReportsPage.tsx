import { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, RefreshCw, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { reportsApi } from '../../api/services';
import { exportToCSV, formatDate } from '../../utils';
import { Spinner, EmptyState, BloodGroupBadge, StatusBadge } from '../../components/ui';

type ReportType =
  | 'inventory'
  | 'donors'
  | 'donations'
  | 'requests'
  | 'hospitals'
  | 'laboratory'
  | 'appointments'
  | 'monthly';

const REPORT_OPTIONS: { id: ReportType; label: string }[] = [
  { id: 'inventory', label: '1. Blood Inventory & Stock Status' },
  { id: 'donors', label: '2. Donor Demographics & Eligibility' },
  { id: 'donations', label: '3. Blood Donation Logs' },
  { id: 'requests', label: '4. Hospital Blood Requests' },
  { id: 'hospitals', label: '5. Partner Hospitals Utilization' },
  { id: 'laboratory', label: '6. Laboratory Screening Pass/Fail' },
  { id: 'appointments', label: '7. Donation Appointments' },
  { id: 'monthly', label: '8. Monthly Blood Collection Trends' },
];

const COLORS = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res: any = null;
      switch (selectedReport) {
        case 'inventory':
          res = await reportsApi.inventory();
          break;
        case 'donors':
          res = await reportsApi.donors();
          break;
        case 'donations':
          res = await reportsApi.donations();
          break;
        case 'requests':
          res = await reportsApi.bloodRequests();
          break;
        case 'hospitals':
          res = await reportsApi.hospitals();
          break;
        case 'laboratory':
          res = await reportsApi.laboratory();
          break;
        case 'appointments':
          res = await reportsApi.appointments();
          break;
        case 'monthly':
          res = await reportsApi.monthlyCollection();
          break;
      }
      setData(res);
    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReport]);

  const handleExportCSV = () => {
    if (!data) return;
    let exportItems: any[] = [];
    let filename = `report_${selectedReport}_${new Date().toISOString().slice(0, 10)}`;

    if (selectedReport === 'inventory') exportItems = data.inventory || [];
    else if (selectedReport === 'donors') exportItems = data.donors || [];
    else if (selectedReport === 'donations') exportItems = data.donations || [];
    else if (selectedReport === 'requests') exportItems = data.requests || [];
    else if (selectedReport === 'hospitals') exportItems = data.hospitals || [];
    else if (selectedReport === 'laboratory') exportItems = data.tests || [];
    else if (selectedReport === 'appointments') exportItems = data.appointments || [];
    else if (selectedReport === 'monthly') exportItems = data.monthly || [];

    if (exportItems.length > 0) {
      exportToCSV(exportItems, filename);
    } else {
      alert('No data rows available to export.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Management Reports & Analytics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Generate operational compliance summaries, donor analytics, and CSV exports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => window.print()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="card" style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {REPORT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedReport(opt.id)}
              className={`btn btn-sm ${selectedReport === opt.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <Spinner size={32} />
        </div>
      ) : !data ? (
        <EmptyState title="No data returned" message="Could not fetch data for this report." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Inventory Report */}
          {selectedReport === 'inventory' && (
            <>
              <div className="card">
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Stock Distribution by Blood Group
                </h2>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.inventory}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="blood_group" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="available_units" fill="#dc2626" name="Available Units" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reserved_units" fill="#3b82f6" name="Reserved Units" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Blood Group</th>
                      <th>Available</th>
                      <th>Reserved</th>
                      <th>Expired</th>
                      <th>Safety Threshold</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inventory?.map((inv: any) => (
                      <tr key={inv.blood_group}>
                        <td><BloodGroupBadge group={inv.blood_group} /></td>
                        <td><strong>{inv.available_units}</strong></td>
                        <td>{inv.reserved_units}</td>
                        <td>{inv.expired_units}</td>
                        <td>{inv.min_threshold}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{formatDate(inv.last_updated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 2. Donors Report */}
          {selectedReport === 'donors' && (
            <>
              <div className="card">
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Registered Donors by Blood Group
                </h2>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.stats}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="blood_group" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#dc2626" name="Donors" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Donor Name</th>
                      <th>Code</th>
                      <th>Blood Group</th>
                      <th>Gender</th>
                      <th>City</th>
                      <th>Eligibility</th>
                      <th>Total Donations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.donors?.slice(0, 50).map((d: any) => (
                      <tr key={d.id}>
                        <td>{d.full_name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{d.donor_code}</td>
                        <td><BloodGroupBadge group={d.blood_group} /></td>
                        <td>{d.gender}</td>
                        <td>{d.city}</td>
                        <td><StatusBadge status={d.eligibility_status} /></td>
                        <td><strong>{d.total_donations}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 3. Donations Report */}
          {selectedReport === 'donations' && (
            <>
              <div className="card">
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Monthly Donations Volume Trend
                </h2>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" name="Collections" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Donation Date</th>
                      <th>Donor Name</th>
                      <th>Blood Group</th>
                      <th>Volume</th>
                      <th>Status</th>
                      <th>Lab Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.donations?.slice(0, 50).map((don: any) => (
                      <tr key={don.id}>
                        <td>{formatDate(don.donation_date)}</td>
                        <td>{don.donor_name}</td>
                        <td><BloodGroupBadge group={don.blood_group} /></td>
                        <td>{don.volume_ml} ml</td>
                        <td><StatusBadge status={don.status} /></td>
                        <td>{don.lab_result ? <StatusBadge status={don.lab_result} /> : 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 4. Requests Report */}
          {selectedReport === 'requests' && (
            <>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request Date</th>
                      <th>Hospital</th>
                      <th>Blood Group</th>
                      <th>Quantity</th>
                      <th>Urgency</th>
                      <th>Required Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests?.map((r: any) => (
                      <tr key={r.id}>
                        <td>{formatDate(r.request_date)}</td>
                        <td>{r.hospital_name}</td>
                        <td><BloodGroupBadge group={r.blood_group} /></td>
                        <td><strong>{r.quantity}</strong> units</td>
                        <td><StatusBadge status={r.urgency} /></td>
                        <td>{formatDate(r.required_date)}</td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* 5. Hospitals Report */}
          {selectedReport === 'hospitals' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Hospital Name</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Total Requests</th>
                    <th>Units Transfused</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hospitals?.map((h: any) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.hospital_name}</td>
                      <td>{h.city}</td>
                      <td>{h.phone}</td>
                      <td><StatusBadge status={h.status} /></td>
                      <td><strong>{h.total_requests}</strong></td>
                      <td><strong>{h.units_received || 0}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Laboratory Report */}
          {selectedReport === 'laboratory' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                    <th>Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tests?.map((t: any) => (
                    <tr key={t.id}>
                      <td>{t.donor_name}</td>
                      <td><BloodGroupBadge group={t.blood_group} /></td>
                      <td><StatusBadge status={t.hiv_test} /></td>
                      <td><StatusBadge status={t.hep_b_test} /></td>
                      <td><StatusBadge status={t.hep_c_test} /></td>
                      <td><StatusBadge status={t.syphilis_test} /></td>
                      <td><StatusBadge status={t.malaria_test} /></td>
                      <td><StatusBadge status={t.overall_result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. Appointments Report */}
          {selectedReport === 'appointments' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Donor Name</th>
                    <th>Blood Group</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments?.map((a: any) => (
                    <tr key={a.id}>
                      <td>{formatDate(a.appointment_date)}</td>
                      <td>{a.appointment_time}</td>
                      <td>{a.donor_name}</td>
                      <td>{a.blood_group ? <BloodGroupBadge group={a.blood_group} /> : '—'}</td>
                      <td>{a.location}</td>
                      <td><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 8. Monthly Collections */}
          {selectedReport === 'monthly' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Blood Group</th>
                    <th>Donations Count</th>
                    <th>Total Volume (ml)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthly?.map((m: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{m.month}</td>
                      <td><BloodGroupBadge group={m.blood_group} /></td>
                      <td><strong>{m.donations}</strong></td>
                      <td>{m.total_ml} ml</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

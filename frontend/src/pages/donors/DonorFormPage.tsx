import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Heart } from 'lucide-react';
import { donorsApi } from '../../api/services';
import { BLOOD_GROUPS } from '../../utils';
import { Input, Select, Textarea, Spinner, AlertBox } from '../../components/ui';

export function DonorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    dob: '1995-01-01',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    address: '',
    city: 'Ahmedabad',
    emergency_contact: '',
    eligibility_status: 'Eligible',
    account_status: 'Active',
  });

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      donorsApi.get(id)
        .then(res => {
          const d = res?.data || res;
          if (d) {
            setFormData({
              full_name: d.full_name || '',
              dob: d.dob ? d.dob.substring(0, 10) : '1995-01-01',
              gender: d.gender || 'Male',
              blood_group: d.blood_group || 'O+',
              phone: d.phone || '',
              email: d.email || '',
              address: d.address || '',
              city: d.city || 'Ahmedabad',
              emergency_contact: d.emergency_contact || '',
              eligibility_status: d.eligibility_status || 'Eligible',
              account_status: d.account_status || 'Active',
            });
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to fetch donor details');
        })
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        emergency_contact: formData.emergency_contact.trim() || undefined,
      };

      if (isEdit && id) {
        await donorsApi.update(id, payload);
      } else {
        await donorsApi.create(payload);
      }
      navigate('/donors');
    } catch (err: any) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.map((e: any) => e.message).join(', ')
        : err.response?.data?.message || 'Failed to save donor record';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/donors" className="btn btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {isEdit ? 'Edit Donor Profile' : 'Register New Donor'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {isEdit ? 'Update donor information and status.' : 'Register a new donor into the blood banking network.'}
          </p>
        </div>
      </div>

      {error && <AlertBox type="error">{error}</AlertBox>}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          Personal Details
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            placeholder="e.g. Ramesh Patel"
          />
          <Input
            label="Date of Birth"
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Select
            label="Blood Group"
            name="blood_group"
            value={formData.blood_group}
            onChange={handleChange}
            options={BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))}
          />
        </div>

        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginTop: '0.5rem' }}>
          Contact & Location
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="10-digit mobile"
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="donor@example.com"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="e.g. Ahmedabad"
          />
          <Input
            label="Emergency Contact Phone"
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
            placeholder="Family member / Guardian phone"
          />
        </div>

        <Textarea
          label="Residential Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street address, locality, landmark"
        />

        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginTop: '0.5rem' }}>
          Eligibility & System Status
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Eligibility Status"
            name="eligibility_status"
            value={formData.eligibility_status}
            onChange={handleChange}
            options={[
              { value: 'Eligible', label: 'Eligible (Approved to donate)' },
              { value: 'Ineligible', label: 'Ineligible (Medical deferral)' },
              { value: 'Temporary Hold', label: 'Temporary Hold (Recovery period)' },
            ]}
          />
          <Select
            label="Account Status"
            name="account_status"
            value={formData.account_status}
            onChange={handleChange}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
              { value: 'Suspended', label: 'Suspended' },
            ]}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => navigate('/donors')} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <Spinner size={16} /> : <Save size={16} />}
            {isEdit ? 'Save Changes' : 'Register Donor'}
          </button>
        </div>
      </form>
    </div>
  );
}

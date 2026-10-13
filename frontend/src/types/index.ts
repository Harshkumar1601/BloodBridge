// Shared TypeScript types for BDBMS frontend

export type Role = 'admin' | 'staff' | 'hospital' | 'donor';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

export interface Donor {
  id: string;
  user_id?: string;
  donor_code: string;
  full_name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: BloodGroup;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  emergency_contact?: string;
  last_donation_date?: string;
  total_donations: number;
  eligibility_status: 'Eligible' | 'Ineligible' | 'Temporary Hold';
  registration_date: string;
  account_status: 'Active' | 'Inactive' | 'Suspended';
  created_at: string;
}

export interface Hospital {
  id: string;
  user_id?: string;
  hospital_name: string;
  registration_number: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  emergency_contact?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';

export interface Appointment {
  id: string;
  donor_id: string;
  donor_name?: string;
  blood_group?: BloodGroup;
  donor_code?: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: AppointmentStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Donation {
  id: string;
  appointment_id?: string;
  donor_id: string;
  donor_name?: string;
  donor_code?: string;
  donation_date: string;
  blood_group: BloodGroup;
  volume_ml: number;
  status: 'Collected' | 'Testing' | 'Passed' | 'Failed' | 'Expired';
  lab_result?: string;
  created_at: string;
}

export interface BloodInventory {
  id: number;
  blood_group: BloodGroup;
  available_units: number;
  reserved_units: number;
  expired_units: number;
  min_threshold: number;
  last_updated: string;
}

export interface InventoryTransaction {
  id: string;
  blood_group: BloodGroup;
  transaction_type: 'Donation' | 'Issue' | 'Reservation' | 'Release' | 'Expiry' | 'Adjustment';
  quantity: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export type RequestStatus = 'Pending' | 'Approved' | 'Partially Fulfilled' | 'Fulfilled' | 'Rejected' | 'Cancelled';
export type RequestUrgency = 'Normal' | 'Urgent' | 'Emergency';

export interface BloodRequest {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  hospital_phone?: string;
  hospital_city?: string;
  blood_group: BloodGroup;
  quantity: number;
  required_date: string;
  urgency: RequestUrgency;
  patient_reference?: string;
  reason?: string;
  request_date: string;
  status: RequestStatus;
  approved_by?: string;
  approved_by_name?: string;
  remarks?: string;
  compatible_donors?: BloodGroup[];
  created_at: string;
}

export type LabResult = 'Pending' | 'Passed' | 'Failed';

export interface LaboratoryTest {
  id: string;
  donation_id: string;
  donor_id: string;
  donor_name?: string;
  donor_code?: string;
  blood_group: BloodGroup;
  hiv_test: 'Pending' | 'Negative' | 'Positive';
  hep_b_test: 'Pending' | 'Negative' | 'Positive';
  hep_c_test: 'Pending' | 'Negative' | 'Positive';
  syphilis_test: 'Pending' | 'Negative' | 'Positive';
  malaria_test: 'Pending' | 'Negative' | 'Positive';
  blood_type_verification: 'Pending' | 'Verified' | 'Mismatch';
  test_date?: string;
  technician?: string;
  overall_result: LabResult;
  remarks?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  is_read: number;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  stats: {
    totalDonors: number;
    activeDonors: number;
    totalHospitals: number;
    pendingRequests: number;
    todayAppointments: number;
    completedDonations: number;
    pendingLabTests: number;
    totalAvailable: number;
    lowStockCount: number;
    criticalStockCount: number;
  };
  inventory: BloodInventory[];
  lowStock: BloodInventory[];
  criticalStock: BloodInventory[];
  recentRequests: BloodRequest[];
  recentDonations: Donation[];
  recentNotifications: Notification[];
  charts: {
    donorRegistrationTrend: { month: string; count: number }[];
    monthlyDonations: { month: string; count: number }[];
    requestsByMonth: { month: string; count: number }[];
    requestStatusDist: { status: string; count: number }[];
  };
}

import { getDb } from './connection';

export function initializeSchema(): void {
  const db = getDb();

  db.exec(`
    -- =============================================
    -- ROLES
    -- =============================================
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- =============================================
    -- USERS
    -- =============================================
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','staff','hospital','donor')),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    -- =============================================
    -- DONORS
    -- =============================================
    CREATE TABLE IF NOT EXISTS donors (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      donor_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('Male','Female','Other')),
      blood_group TEXT NOT NULL CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
      phone TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      address TEXT,
      city TEXT,
      emergency_contact TEXT,
      last_donation_date TEXT,
      total_donations INTEGER NOT NULL DEFAULT 0,
      eligibility_status TEXT NOT NULL DEFAULT 'Eligible' CHECK(eligibility_status IN ('Eligible','Ineligible','Temporary Hold')),
      registration_date TEXT NOT NULL,
      account_status TEXT NOT NULL DEFAULT 'Active' CHECK(account_status IN ('Active','Inactive','Suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
    CREATE INDEX IF NOT EXISTS idx_donors_city ON donors(city);
    CREATE INDEX IF NOT EXISTS idx_donors_eligibility ON donors(eligibility_status);

    -- =============================================
    -- HOSPITALS
    -- =============================================
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      hospital_name TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      address TEXT,
      city TEXT,
      emergency_contact TEXT,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- =============================================
    -- APPOINTMENTS
    -- =============================================
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      donor_id TEXT NOT NULL REFERENCES donors(id),
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT 'Main Blood Bank',
      status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled','Confirmed','Completed','Cancelled','No Show')),
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_donor ON appointments(donor_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

    -- =============================================
    -- DONATIONS
    -- =============================================
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      appointment_id TEXT REFERENCES appointments(id),
      donor_id TEXT NOT NULL REFERENCES donors(id),
      donation_date TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      volume_ml INTEGER NOT NULL DEFAULT 450,
      status TEXT NOT NULL DEFAULT 'Collected' CHECK(status IN ('Collected','Testing','Passed','Failed','Expired')),
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
    CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);

    -- =============================================
    -- BLOOD INVENTORY
    -- =============================================
    CREATE TABLE IF NOT EXISTS blood_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blood_group TEXT NOT NULL UNIQUE CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
      available_units INTEGER NOT NULL DEFAULT 0,
      reserved_units INTEGER NOT NULL DEFAULT 0,
      expired_units INTEGER NOT NULL DEFAULT 0,
      min_threshold INTEGER NOT NULL DEFAULT 10,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- =============================================
    -- INVENTORY TRANSACTIONS
    -- =============================================
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      blood_group TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Donation','Issue','Reservation','Release','Expiry','Adjustment')),
      quantity INTEGER NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_inv_trans_blood_group ON inventory_transactions(blood_group);
    CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions(transaction_type);

    -- =============================================
    -- BLOOD REQUESTS
    -- =============================================
    CREATE TABLE IF NOT EXISTS blood_requests (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      blood_group TEXT NOT NULL CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
      quantity INTEGER NOT NULL,
      required_date TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'Normal' CHECK(urgency IN ('Normal','Urgent','Emergency')),
      patient_reference TEXT,
      reason TEXT,
      request_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Partially Fulfilled','Fulfilled','Rejected','Cancelled')),
      approved_by TEXT REFERENCES users(id),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_requests_hospital ON blood_requests(hospital_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_urgency ON blood_requests(urgency);

    -- =============================================
    -- LABORATORY TESTS
    -- =============================================
    CREATE TABLE IF NOT EXISTS laboratory_tests (
      id TEXT PRIMARY KEY,
      donation_id TEXT NOT NULL UNIQUE REFERENCES donations(id),
      donor_id TEXT NOT NULL REFERENCES donors(id),
      blood_group TEXT NOT NULL,
      hiv_test TEXT DEFAULT 'Pending' CHECK(hiv_test IN ('Pending','Negative','Positive')),
      hep_b_test TEXT DEFAULT 'Pending' CHECK(hep_b_test IN ('Pending','Negative','Positive')),
      hep_c_test TEXT DEFAULT 'Pending' CHECK(hep_c_test IN ('Pending','Negative','Positive')),
      syphilis_test TEXT DEFAULT 'Pending' CHECK(syphilis_test IN ('Pending','Negative','Positive')),
      malaria_test TEXT DEFAULT 'Pending' CHECK(malaria_test IN ('Pending','Negative','Positive')),
      blood_type_verification TEXT DEFAULT 'Pending' CHECK(blood_type_verification IN ('Pending','Verified','Mismatch')),
      test_date TEXT,
      technician TEXT,
      overall_result TEXT NOT NULL DEFAULT 'Pending' CHECK(overall_result IN ('Pending','Passed','Failed')),
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_lab_donation ON laboratory_tests(donation_id);
    CREATE INDEX IF NOT EXISTS idx_lab_result ON laboratory_tests(overall_result);

    -- =============================================
    -- NOTIFICATIONS
    -- =============================================
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info','success','warning','error','alert')),
      is_read INTEGER NOT NULL DEFAULT 0,
      reference_id TEXT,
      reference_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);

    -- =============================================
    -- AUDIT LOGS
    -- =============================================
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      user_email TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity);
  `);

  console.log('✅ Database schema initialized');
}

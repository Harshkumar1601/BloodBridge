import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './connection';
import { initializeSchema } from './schema';

export async function seedDatabase(): Promise<void> {
  const db = getDb();
  initializeSchema();

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (existing.count > 0) {
    console.log('⚠️  Database already has data. Use db:reset to reseed.');
    return;
  }

  await runSeed(db);
  console.log('✅ Database seeded successfully');
}

export async function runSeed(db: ReturnType<typeof getDb>): Promise<void> {
  const adminPw = await bcrypt.hash('Admin@123', 12);
  const staffPw = await bcrypt.hash('Staff@123', 12);
  const hospitalPw = await bcrypt.hash('Hospital@123', 12);
  const donorPw = await bcrypt.hash('Donor@123', 12);

  // =============================================
  // USERS
  // =============================================
  const adminId = uuidv4();
  const staffId = uuidv4();
  const hospitalUserId = uuidv4();
  const donorUserId = uuidv4();

  // Extra user IDs for richer seed data
  const staff2Id = uuidv4();
  const hospital2UserId = uuidv4();

  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(adminId, 'admin@bdbms.com', adminPw, 'admin', 'System', 'Administrator', 1);
  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(staffId, 'staff@bdbms.com', staffPw, 'staff', 'Priya', 'Sharma', 1);
  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(staff2Id, 'staff2@bdbms.com', staffPw, 'staff', 'Rahul', 'Verma', 1);
  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(hospitalUserId, 'hospital@bdbms.com', hospitalPw, 'hospital', 'AIIMS', 'Delhi', 1);
  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(hospital2UserId, 'hospital2@bdbms.com', hospitalPw, 'hospital', 'Fortis', 'Hospital', 1);
  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(donorUserId, 'donor@bdbms.com', donorPw, 'donor', 'Arjun', 'Mehta', 1);

  // =============================================
  // BLOOD INVENTORY — Initialize all 8 groups
  // =============================================
  const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const inventoryData: Record<string, {avail: number, reserved: number, expired: number, threshold: number}> = {
    'A+':  { avail: 45, reserved: 5,  expired: 2, threshold: 15 },
    'A-':  { avail: 8,  reserved: 2,  expired: 1, threshold: 10 },
    'B+':  { avail: 38, reserved: 4,  expired: 3, threshold: 15 },
    'B-':  { avail: 6,  reserved: 1,  expired: 0, threshold: 10 },
    'AB+': { avail: 20, reserved: 3,  expired: 1, threshold: 8  },
    'AB-': { avail: 3,  reserved: 0,  expired: 0, threshold: 5  },
    'O+':  { avail: 55, reserved: 8,  expired: 4, threshold: 20 },
    'O-':  { avail: 12, reserved: 3,  expired: 2, threshold: 15 },
  };

  for (const bg of bloodGroups) {
    const d = inventoryData[bg];
    db.prepare(`INSERT INTO blood_inventory (blood_group, available_units, reserved_units, expired_units, min_threshold) VALUES (?, ?, ?, ?, ?)`).run(bg, d.avail, d.reserved, d.expired, d.threshold);
  }

  // =============================================
  // HOSPITALS
  // =============================================
  const h1Id = uuidv4();
  const h2Id = uuidv4();
  const h3Id = uuidv4();
  const h4Id = uuidv4();
  const h5Id = uuidv4();

  const hospitals = [
    [h1Id, hospitalUserId, 'AIIMS Delhi', 'REG-001', 'Dr. Suresh Kumar', '011-26588500', 'hospital@bdbms.com', 'Ansari Nagar, New Delhi', 'New Delhi', '9811001001', 'Active'],
    [h2Id, hospital2UserId, 'Fortis Healthcare', 'REG-002', 'Dr. Aarti Singh', '011-42776222', 'hospital2@bdbms.com', 'Sector 44, Gurugram', 'Gurugram', '9811002002', 'Active'],
    [h3Id, null, 'Max Super Speciality Hospital', 'REG-003', 'Dr. Vikram Mehta', '011-26515050', 'maxhospital@example.com', 'Press Enclave Road, Saket', 'New Delhi', '9811003003', 'Active'],
    [h4Id, null, 'Apollo Hospitals', 'REG-004', 'Dr. Sunita Reddy', '040-23607777', 'apollo@example.com', 'Jubilee Hills, Hyderabad', 'Hyderabad', '9811004004', 'Active'],
    [h5Id, null, 'Medanta The Medicity', 'REG-005', 'Dr. Ramesh Gupta', '0124-4141414', 'medanta@example.com', 'Sector 38, Gurugram', 'Gurugram', '9811005005', 'Inactive'],
  ];

  for (const h of hospitals) {
    db.prepare(`INSERT INTO hospitals (id, user_id, hospital_name, registration_number, contact_person, phone, email, address, city, emergency_contact, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...h);
  }

  // =============================================
  // DONORS (20 donors)
  // =============================================
  const donorData = [
    ['Arjun Mehta',     '1990-05-15', 'Male',   'O+',  '9876543210', 'donor@bdbms.com',          'Delhi', '2024-01-10', 5, 'Eligible',        'Active'],
    ['Priya Patel',     '1995-08-22', 'Female', 'A+',  '9876543211', 'priya.patel@example.com',  'Mumbai','2024-02-14', 3, 'Eligible',        'Active'],
    ['Rahul Singh',     '1988-11-30', 'Male',   'B+',  '9876543212', 'rahul.singh@example.com',  'Delhi', '2024-03-05', 7, 'Eligible',        'Active'],
    ['Sneha Gupta',     '1993-04-17', 'Female', 'AB+', '9876543213', 'sneha.gupta@example.com',  'Pune',  '2024-01-20', 2, 'Eligible',        'Active'],
    ['Amit Sharma',     '1985-09-08', 'Male',   'O-',  '9876543214', 'amit.sharma@example.com',  'Delhi', '2024-04-12', 10,'Eligible',        'Active'],
    ['Nisha Verma',     '1997-12-25', 'Female', 'A-',  '9876543215', 'nisha.verma@example.com',  'Jaipur','2024-02-28', 1, 'Eligible',        'Active'],
    ['Vikram Kumar',    '1991-07-03', 'Male',   'B-',  '9876543216', 'vikram.kumar@example.com', 'Delhi', '2023-12-10', 4, 'Temporary Hold',  'Active'],
    ['Aarti Joshi',     '1994-03-19', 'Female', 'AB-', '9876543217', 'aarti.joshi@example.com',  'Mumbai','2024-03-15', 0, 'Eligible',        'Active'],
    ['Suresh Nair',     '1986-06-28', 'Male',   'O+',  '9876543218', 'suresh.nair@example.com',  'Chennai','2024-01-05',8, 'Eligible',        'Active'],
    ['Kavya Reddy',     '1996-10-11', 'Female', 'A+',  '9876543219', 'kavya.reddy@example.com',  'Hyderabad','2024-04-01',2,'Eligible',       'Active'],
    ['Manoj Tiwari',    '1989-02-14', 'Male',   'B+',  '9876543220', 'manoj.tiwari@example.com', 'Lucknow','2024-02-10',6,'Eligible',        'Active'],
    ['Deepa Pillai',    '1992-08-07', 'Female', 'O-',  '9876543221', 'deepa.pillai@example.com', 'Kochi', '2023-11-20', 3, 'Ineligible',     'Inactive'],
    ['Sanjay Bose',     '1987-01-23', 'Male',   'AB+', '9876543222', 'sanjay.bose@example.com',  'Kolkata','2024-03-22', 5,'Eligible',        'Active'],
    ['Pooja Malhotra',  '1998-05-30', 'Female', 'A-',  '9876543223', 'pooja.malhotra@example.com','Gurugram','2024-04-08',1,'Eligible',       'Active'],
    ['Karthik Raja',    '1990-09-15', 'Male',   'B+',  '9876543224', 'karthik.raja@example.com', 'Bengaluru','2024-01-30',9,'Eligible',       'Active'],
    ['Ananya Sen',      '1994-12-03', 'Female', 'O+',  '9876543225', 'ananya.sen@example.com',   'Kolkata','2024-02-25', 4, 'Eligible',       'Active'],
    ['Rohan Kapoor',    '1993-07-18', 'Male',   'A+',  '9876543226', 'rohan.kapoor@example.com', 'Mumbai', '2024-03-30', 2, 'Eligible',       'Active'],
    ['Meera Iyer',      '1991-04-05', 'Female', 'B-',  '9876543227', 'meera.iyer@example.com',   'Chennai','2024-01-15', 6, 'Eligible',       'Active'],
    ['Aditya Pandey',   '1988-11-12', 'Male',   'AB-', '9876543228', 'aditya.pandey@example.com','Varanasi','2023-12-01',1,'Eligible',        'Active'],
    ['Sunita Chauhan',  '1996-06-20', 'Female', 'O-',  '9876543229', 'sunita.chauhan@example.com','Agra',  '2024-04-18', 0, 'Eligible',       'Active'],
  ];

  const donorIds: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < donorData.length; i++) {
    const d = donorData[i];
    const id = uuidv4();
    const code = `DON-${String(1001 + i).padStart(4, '0')}`;
    const uid = i === 0 ? donorUserId : null;
    donorIds.push(id);
    // d: [name(0), dob(1), gender(2), bg(3), phone(4), email(5), city(6), last_don_date(7), total_donations(8), eligibility(9), account_status(10)]
    db.prepare(`INSERT INTO donors (id, user_id, donor_code, full_name, dob, gender, blood_group, phone, email, address, city, emergency_contact, last_donation_date, total_donations, eligibility_status, registration_date, account_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, uid, code, d[0], d[1], d[2], d[3], d[4], d[5], `${d[6]}, India`, d[6], '9800000000', d[7] || null, d[8], d[9], today, d[10]);
  }

  // =============================================
  // APPOINTMENTS (15)
  // =============================================
  const apptStatuses = ['Completed','Completed','Completed','Completed','Completed','Confirmed','Confirmed','Scheduled','Scheduled','Scheduled','Cancelled','No Show','Completed','Completed','Confirmed'];
  const apptDates = [
    '2026-08-01','2026-08-05','2026-08-10','2026-08-15','2026-08-20',
    '2026-09-01','2026-09-05','2026-10-10','2026-10-15','2026-10-20',
    '2026-07-15','2026-07-20','2026-09-15','2026-09-20','2026-10-25',
  ];
  const apptTimes = ['09:00','10:30','11:00','14:00','15:30','09:30','11:30','10:00','14:30','16:00','09:00','10:00','11:00','13:00','15:00'];

  const appointmentIds: string[] = [];
  for (let i = 0; i < 15; i++) {
    const id = uuidv4();
    appointmentIds.push(id);
    db.prepare(`INSERT INTO appointments (id, donor_id, appointment_date, appointment_time, location, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, donorIds[i % donorIds.length], apptDates[i], apptTimes[i], 'Main Blood Bank - Block A', apptStatuses[i], null, staffId);
  }

  // =============================================
  // DONATIONS (10 — from completed appointments)
  // =============================================
  const completedApptIndices = [0,1,2,3,4,12,13];
  const donationIds: string[] = [];
  const donationDonorIndices = completedApptIndices;

  for (const idx of completedApptIndices) {
    const id = uuidv4();
    donationIds.push(id);
    const donorIdx = idx % donorIds.length;
    db.prepare(`INSERT INTO donations (id, appointment_id, donor_id, donation_date, blood_group, volume_ml, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, appointmentIds[idx], donorIds[donorIdx], apptDates[idx], donorData[donorIdx][3] as string, 450, 'Passed', staffId);
    // Update last donation date and total_donations
    db.prepare(`UPDATE donors SET last_donation_date = ?, total_donations = total_donations + 1 WHERE id = ?`).run(apptDates[idx], donorIds[donorIdx]);
  }

  // =============================================
  // LABORATORY TESTS (15)
  // =============================================
  const labResults = ['Passed','Passed','Passed','Passed','Passed','Passed','Passed','Failed','Pending','Pending','Pending','Passed','Passed','Passed','Pending'];
  const technicians = ['Dr. Anand Lab','Dr. Priya Lab','Lab Tech Ravi','Lab Tech Meena','Dr. Sundar Lab','Dr. Anand Lab','Lab Tech Ravi'];

  for (let i = 0; i < donationIds.length; i++) {
    const id = uuidv4();
    const result = labResults[i] || 'Pending';
    const donorIdx = completedApptIndices[i] % donorIds.length;
    const isPassed = result === 'Passed';
    const isFailed = result === 'Failed';
    db.prepare(`INSERT INTO laboratory_tests (id, donation_id, donor_id, blood_group, hiv_test, hep_b_test, hep_c_test, syphilis_test, malaria_test, blood_type_verification, test_date, technician, overall_result, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, donationIds[i], donorIds[donorIdx], donorData[donorIdx][3] as string,
      isPassed ? 'Negative' : isFailed ? 'Positive' : 'Pending',
      isPassed ? 'Negative' : 'Pending',
      isPassed ? 'Negative' : 'Pending',
      isPassed ? 'Negative' : 'Pending',
      isPassed ? 'Negative' : 'Pending',
      isPassed ? 'Verified' : 'Pending',
      isPassed || isFailed ? apptDates[completedApptIndices[i]] : null,
      technicians[i % technicians.length],
      result,
      isPassed ? 'All tests passed. Blood cleared for inventory.' : isFailed ? 'HIV test positive. Blood discarded.' : null
    );
  }

  // =============================================
  // INVENTORY TRANSACTIONS (initial seed transactions)
  // =============================================
  const txData = [
    ['A+',  'Donation',    10, 'Initial stock donation batch'],
    ['A-',  'Donation',    5,  'Initial stock donation batch'],
    ['B+',  'Donation',    12, 'Initial stock donation batch'],
    ['B-',  'Donation',    4,  'Initial stock donation batch'],
    ['AB+', 'Donation',    8,  'Initial stock donation batch'],
    ['AB-', 'Donation',    2,  'Initial stock donation batch'],
    ['O+',  'Donation',    20, 'Initial stock donation batch'],
    ['O-',  'Donation',    6,  'Initial stock donation batch'],
    ['A+',  'Issue',       -3, 'Issued to AIIMS Delhi'],
    ['O+',  'Issue',       -5, 'Issued to Fortis Healthcare'],
    ['B+',  'Reservation', 4,  'Reserved for Max Hospital request'],
    ['A-',  'Expiry',      -2, 'Expired units removed'],
    ['O-',  'Adjustment',  3,  'Stock correction after audit'],
  ];

  for (const tx of txData) {
    db.prepare(`INSERT INTO inventory_transactions (id, blood_group, transaction_type, quantity, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), tx[0], tx[1], tx[2], tx[3], adminId);
  }

  // =============================================
  // BLOOD REQUESTS (8)
  // =============================================
  const requestData = [
    [h1Id, 'O+',  5, '2026-10-15', 'Emergency', 'PT-001', 'Trauma surgery',         'Approved',           adminId,  'Approved — inventory reserved'],
    [h1Id, 'A+',  3, '2026-10-20', 'Urgent',    'PT-002', 'Major surgery prep',     'Fulfilled',          adminId,  'Fulfilled on time'],
    [h2Id, 'B+',  2, '2026-10-25', 'Normal',    'PT-003', 'Elective surgery',       'Pending',            null,     null],
    [h2Id, 'AB-', 1, '2026-10-12', 'Emergency', 'PT-004', 'Rare blood type needed', 'Approved',           staffId,  'Stock reserved'],
    [h3Id, 'O-',  4, '2026-10-18', 'Urgent',    'PT-005', 'Emergency transfusion',  'Partially Fulfilled',staffId,  '2 units available, 2 pending'],
    [h3Id, 'A-',  2, '2026-11-01', 'Normal',    'PT-006', 'Scheduled transfusion',  'Rejected',           adminId,  'Insufficient stock at time of request'],
    [h4Id, 'B-',  1, '2026-10-30', 'Normal',    'PT-007', 'Post-op transfusion',    'Pending',            null,     null],
    [h5Id, 'O+',  6, '2026-10-22', 'Urgent',    'PT-008', 'Multiple trauma cases',  'Cancelled',          null,     'Hospital cancelled the request'],
  ];

  for (const r of requestData) {
    db.prepare(`INSERT INTO blood_requests (id, hospital_id, blood_group, quantity, required_date, urgency, patient_reference, reason, request_date, status, approved_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), r[0], r[1], r[2], r[3], r[4], r[5], r[6], '2026-10-08', r[7], r[8] || null, r[9] || null);
  }

  // =============================================
  // NOTIFICATIONS (20)
  // =============================================
  const notifData = [
    [adminId,     'New Blood Request',         'AIIMS Delhi has submitted a new emergency blood request for O+ (5 units).', 'alert',   0, null],
    [adminId,     'Low Blood Stock Alert',      'A- blood group is critically low (8 units). Minimum threshold is 10.', 'warning', 0, null],
    [staffId,     'Appointment Confirmed',      'Appointment for Arjun Mehta on 10 Oct has been confirmed.',              'success', 1, null],
    [staffId,     'Lab Result Submitted',       'Laboratory test result for Donation #DON-001 has been submitted.',       'info',    1, null],
    [adminId,     'Request Fulfilled',          'Blood request from Fortis Healthcare (A+, 3 units) has been fulfilled.', 'success', 1, null],
    [hospitalUserId, 'Request Approved',        'Your blood request for O+ (5 units) has been approved by the blood bank.','success',0, null],
    [hospitalUserId, 'Request Status Update',   'Your blood request #REQ-003 status changed to Partially Fulfilled.',    'info',    0, null],
    [donorUserId, 'Appointment Scheduled',      'Your donation appointment is scheduled for October 15, 2026.',          'info',    0, null],
    [donorUserId, 'Donation Thank You',         'Thank you for your donation on Sep 15, 2026. You saved lives!',         'success', 1, null],
    [adminId,     'System Alert',               'Blood inventory audit completed. 2 units of A- expired and removed.',   'warning', 1, null],
    [staffId,     'New Donor Registered',       'New donor Sunita Chauhan (O-) has been registered in the system.',      'info',    0, null],
    [adminId,     'Lab Result: Passed',         'Blood unit from Arjun Mehta passed all laboratory tests and is now in inventory.', 'success', 1, null],
    [adminId,     'Lab Result: Failed',         'Blood unit failed HIV screening. Unit discarded per protocol.',         'error',   0, null],
    [hospitalUserId, 'Request Rejected',        'Your blood request for A- (2 units) was rejected. Insufficient stock.','error',   0, null],
    [staffId,     'Appointment: No Show',       'Donor Vikram Kumar did not appear for scheduled appointment on Jul 20.','warning', 1, null],
    [adminId,     'Critical Stock: AB-',        'AB- blood stock is critically low (3 units). Immediate action required.','alert',  0, null],
    [staffId,     'Monthly Report Ready',       'October monthly blood collection report is ready for review.',          'info',    0, null],
    [donorUserId, 'Eligibility Reminder',       'You are eligible to donate again! Your 90-day waiting period is over.', 'info',    0, null],
    [adminId,     'New Hospital Registered',    'Apollo Hospitals (Hyderabad) has been registered in the system.',      'info',    1, null],
    [adminId,     'Demo Data Loaded',           'System has been initialized with demonstration data for all modules.',  'success', 1, null],
  ];

  for (const n of notifData) {
    db.prepare(`INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), n[0], n[1], n[2], n[3], n[4]);
  }

  // =============================================
  // AUDIT LOGS (initial entries)
  // =============================================
  const auditEntries = [
    [adminId,     'admin@bdbms.com',    'LOGIN',            'users',           adminId,     null, null, 'System initialized'],
    [staffId,     'staff@bdbms.com',    'CREATE',           'donors',          donorIds[0], null, null, 'Donor Arjun Mehta registered'],
    [staffId,     'staff@bdbms.com',    'CREATE',           'appointments',    appointmentIds[0], null, null, 'Appointment booked'],
    [staffId,     'staff@bdbms.com',    'UPDATE',           'appointments',    appointmentIds[0], null, null, 'Appointment marked Completed'],
    [staffId,     'staff@bdbms.com',    'CREATE',           'donations',       donationIds[0], null, null, 'Donation recorded'],
    [staffId,     'staff@bdbms.com',    'UPDATE',           'laboratory_tests',null, null, null, 'Lab results submitted — Passed'],
    [adminId,     'admin@bdbms.com',    'UPDATE',           'blood_inventory',  null, null, null, 'Inventory updated after lab pass'],
    [adminId,     'admin@bdbms.com',    'APPROVE',          'blood_requests',   null, null, null, 'Blood request approved'],
    [adminId,     'admin@bdbms.com',    'CREATE',           'hospitals',        h4Id, null, null, 'Apollo Hospitals registered'],
    [staffId,     'staff@bdbms.com',    'UPDATE',           'donors',           donorIds[6], null, null, 'Donor eligibility changed to Temporary Hold'],
  ];

  for (const a of auditEntries) {
    db.prepare(`INSERT INTO audit_logs (id, user_id, user_email, action, entity, entity_id, old_values, new_values, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), a[0], a[1], a[2], a[3], a[4] || null, a[5] || null, a[6] || null, '127.0.0.1');
  }
}

// Allow running directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

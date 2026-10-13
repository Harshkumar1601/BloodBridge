import { getDb } from './connection';
import { initializeSchema } from './schema';
import { runSeed } from './seed';

async function resetDatabase(): Promise<void> {
  const db = getDb();

  // Drop all tables in correct order (respecting FKs)
  db.pragma('foreign_keys = OFF');
  db.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS laboratory_tests;
    DROP TABLE IF EXISTS inventory_transactions;
    DROP TABLE IF EXISTS blood_requests;
    DROP TABLE IF EXISTS blood_inventory;
    DROP TABLE IF EXISTS donations;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS donors;
    DROP TABLE IF EXISTS hospitals;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS roles;
  `);
  db.pragma('foreign_keys = ON');

  initializeSchema();
  await runSeed(db);
  console.log('✅ Database reset and reseeded successfully');
}

resetDatabase().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

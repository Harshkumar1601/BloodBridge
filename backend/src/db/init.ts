import { initializeSchema } from './schema';
import { seedDatabase } from './seed';

async function init() {
  initializeSchema();
  await seedDatabase();
  console.log('✅ Database initialized');
  process.exit(0);
}

init().catch(e => { console.error(e); process.exit(1); });

import { initializeDatabase } from '../migrations/initializeTables.js';
import { seedDatabase } from '../seeders/seedData.js';
import { runMigration as runTriggerMigration } from '../migrations/dropProblematicTriggers.js';
import config from './index.js';

const setupDatabase = async () => {
  try {
    await initializeDatabase();
    await runTriggerMigration();

    if (config.NODE_ENV !== 'test') {
      await seedDatabase();
    }

    return true;
  } catch (error) {
    globalThis.appLogger.error('Database setup failed:', error);

    if (config.NODE_ENV !== 'test') {
      process.exit(1);
    }

    throw error;
  }
};

const checkDatabaseHealth = async () => {
  try {
    const db = await import('./db.js');
    await db.default.testConnection();
    return true;
  } catch (error) {
    globalThis.appLogger.error('Database health check failed:', error);
    return false;
  }
};

const resetDatabase = async () => {
  if (config.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production environment');
  }

  try {
    await setupDatabase();
    return true;
  } catch (error) {
    globalThis.appLogger.error('Database reset failed:', error);
    throw error;
  }
};

export default setupDatabase;
export { checkDatabaseHealth, resetDatabase };

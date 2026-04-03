import { initializeDatabase } from '../models/createTables.js';
import { seedDatabase } from '../models/seedData.js';
import config from './index.js';

const setupDatabase = async () => {
  try {
    console.log('🗄️  Initializing MindArena database...');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🏷️  Database: ${config.DB_NAME}`);
    
    // Step 1: Create all tables
    console.log('📋 Creating database tables...');
    await initializeDatabase();
    console.log('✅ Database tables created successfully');
    
    // Step 2: Seed initial data (only if not in test environment)
    if (config.NODE_ENV !== 'test') {
      console.log('🌱 Seeding initial data...');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
    } else {
      console.log('⏭️  Skipping data seeding in test environment');
    }
    
    console.log('🎉 Database setup completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    // Provide helpful error messages based on error type
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Check your database credentials:');
      console.error('   - DB_USER:', config.DB_USER);
      console.error('   - DB_PASSWORD: [hidden]');
      console.error('   - DB_HOST:', config.DB_HOST);
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database not found. Please create the database:');
      console.error(`   CREATE DATABASE ${config.DB_NAME};`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Check if MySQL is running:');
      console.error('   - MySQL service status');
      console.error('   - DB_HOST and DB_PORT settings');
    }
    
    // Don't exit in test environment, let tests handle the error
    if (config.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    console.log('🏥 Checking database health...');
    
    // This would typically check if tables exist and have data
    // For now, we'll just try to connect
    const db = await import('./db.js');
    await db.default.testConnection();
    
    console.log('✅ Database is healthy');
    return true;
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

// Reset database (for development/testing)
const resetDatabase = async () => {
  if (config.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production environment');
  }
  
  try {
    console.log('🔄 Resetting database...');
    
    // This would typically drop and recreate tables
    // For now, we'll just reinitialize
    await setupDatabase();
    
    console.log('✅ Database reset completed');
    return true;
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
};

export default setupDatabase;
export { checkDatabaseHealth, resetDatabase };

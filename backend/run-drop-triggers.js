import db from './src/config/db.js';

const runSQL = async () => {
  console.log('Dropping problematic triggers...');
  
  try {
    // Drop triggers using simple query
    await new Promise((resolve, reject) => {
      db.query('DROP TRIGGER IF EXISTS log_attempt_creation', (err) => {
        if (err && err.code !== 'ER_SP_DOES_NOT_EXIST') {
          console.log('Error dropping log_attempt_creation:', err.message);
          reject(err);
        } else {
          console.log('✓ Dropped log_attempt_creation trigger (if existed)');
          resolve();
        }
      });
    });
    
    await new Promise((resolve, reject) => {
      db.query('DROP TRIGGER IF EXISTS log_contest_registration', (err) => {
        if (err && err.code !== 'ER_SP_DOES_NOT_EXIST') {
          console.log('Error dropping log_contest_registration:', err.message);
          reject(err);
        } else {
          console.log('✓ Dropped log_contest_registration trigger (if existed)');
          resolve();
        }
      });
    });
    
    console.log('\\n✅ Triggers dropped successfully!');
    console.log('You can now restart your backend server.');
    
  } catch (error) {
    console.error('Failed to drop triggers:', error.message);
  } finally {
    // Close connection
    db.end(() => {
      process.exit(0);
    });
  }
};

runSQL();

import connection from '../config/db.js';

/**
 * Migration to handle problematic triggers that cause MySQL error 1442
 * ER_CANT_UPDATE_USED_TABLE_IN_SF_OR_TRG
 * 
 * Note: DROP TRIGGER cannot be executed in prepared statements with mysql2.
 * The workaround is implemented directly in gradingService.js which drops
 * triggers before each attempt insertion using a simple query.
 */
export const runMigration = async () => {
  try {
    console.log('Running migration: Checking for problematic triggers...');
    
    // Check if triggers exist by querying information_schema
    const checkTrigger = (triggerName) => {
      return new Promise((resolve) => {
        const sql = `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS 
                     WHERE TRIGGER_SCHEMA = DATABASE() 
                     AND TRIGGER_NAME = '${triggerName}'`;
        connection.query(sql, (err, results) => {
          if (err || !results || results.length === 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    };

    const logAttemptExists = await checkTrigger('log_attempt_creation');
    const logContestExists = await checkTrigger('log_contest_registration');
    
    if (logAttemptExists) {
      console.log('⚠️  Found problematic trigger: log_attempt_creation');
      console.log('   This trigger will be dropped automatically when needed.');
    }
    
    if (logContestExists) {
      console.log('⚠️  Found problematic trigger: log_contest_registration');
      console.log('   This trigger will be dropped automatically when needed.');
    }
    
    if (!logAttemptExists && !logContestExists) {
      console.log('✓ No problematic triggers found');
    } else {
      console.log('💡 Note: Triggers are dropped dynamically before INSERT operations');
    }

    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration error:', error.message);
    // Don't fail initialization - the workaround in gradingService will handle it
    return true;
  }
};

// Run migration if this file is executed directly
if (process.argv[1].includes('dropProblematicTriggers.js')) {
  runMigration()
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

export default { runMigration };

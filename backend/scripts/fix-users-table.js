import db from '../src/config/db.js';

const fixUsersTable = async () => {
  try {
    console.log('🔧 Fixing users table schema...');
    
    // Disable foreign key checks
    const disableFkSql = 'SET FOREIGN_KEY_CHECKS = 0';
    
    db.query(disableFkSql, [], (err) => {
      if (err) {
        console.error('Error disabling foreign key checks:', err);
        process.exit(1);
      }
      
      console.log('✅ Foreign key checks disabled');
      
      // Drop the existing users table
      const dropTableSql = 'DROP TABLE IF EXISTS users';
      
      db.query(dropTableSql, [], (err) => {
        if (err) {
          console.error('Error dropping users table:', err);
          process.exit(1);
        }
        
        console.log('✅ Users table dropped');
        
        // Recreate the users table with correct NULL constraints
        const createTableSql = `
          CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(100) NULL,
            grade_level_id INT NULL,
            points INT DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE SET NULL,
            INDEX idx_email (email),
            INDEX idx_grade_level (grade_level_id),
            INDEX idx_points (points DESC)
          )
        `;
        
        db.query(createTableSql, [], (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            process.exit(1);
          }
          
          console.log('✅ Users table recreated with correct schema');
          
          // Re-enable foreign key checks
          const enableFkSql = 'SET FOREIGN_KEY_CHECKS = 1';
          
          db.query(enableFkSql, [], (err) => {
            if (err) {
              console.error('Error re-enabling foreign key checks:', err);
              process.exit(1);
            }
            
            console.log('✅ Foreign key checks re-enabled');
            console.log('🎉 Users table fix completed successfully!');
            process.exit(0);
          });
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Error fixing users table:', error);
    process.exit(1);
  }
};

fixUsersTable();

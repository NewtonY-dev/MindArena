import db from '../config/db.js';

export const fixContestsTable = () => {
  return new Promise((resolve, reject) => {
    // Get current columns
    db.query(`DESCRIBE contests`, (err, columns) => {
      if (err) {
        console.log('Could not describe contests table (may not exist yet):', err.message);
        resolve();
        return;
      }
      
      const existingColumns = columns.map(c => c.Field);
      const fixes = [];
      
      if (!existingColumns.includes('start_time')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
      }
      if (!existingColumns.includes('end_time')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN end_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
      }
      if (!existingColumns.includes('status')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN status ENUM('upcoming', 'active', 'passed') DEFAULT 'upcoming'`);
      }
      if (!existingColumns.includes('question_count')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN question_count INT DEFAULT 10`);
      }
      if (!existingColumns.includes('time_per_question')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN time_per_question INT DEFAULT 30`);
      }
      if (!existingColumns.includes('grade_level_id')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN grade_level_id INT NULL`);
      }
      if (!existingColumns.includes('subject_id')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN subject_id INT NULL`);
      }
      if (!existingColumns.includes('created_by')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN created_by INT NOT NULL DEFAULT 1`);
      }
      if (!existingColumns.includes('description')) {
        fixes.push(`ALTER TABLE contests ADD COLUMN description TEXT NULL`);
      }

      if (fixes.length === 0) {
        console.log('Contests table structure is correct');
        resolve();
        return;
      }

      let completed = 0;
      let errors = [];

      fixes.forEach((sql) => {
        db.query(sql, (err) => {
          completed++;
          if (err) {
            errors.push(err.message);
          }
          
          if (completed === fixes.length) {
            if (errors.length > 0) {
              console.log('Some table fixes had issues:', errors);
            } else {
              console.log('Contests table structure updated successfully');
            }
            resolve();
          }
        });
      });
    });
  });
};

export default fixContestsTable;

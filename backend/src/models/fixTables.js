import db from '../config/db.js';

const fixTable = (tableName, requiredColumns) => {
  return new Promise((resolve) => {
    db.query(`DESCRIBE ${tableName}`, (err, columns) => {
      if (err) {
        console.log(`Could not describe ${tableName} table:`, err.message);
        resolve();
        return;
      }
      
      const existingColumns = columns.map(c => c.Field);
      const fixes = [];
      
      for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(columnName)) {
          fixes.push(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
        }
      }

      if (fixes.length === 0) {
        console.log(`${tableName} table structure is correct`);
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
              console.log(`Some ${tableName} fixes had issues:`, errors);
            } else {
              console.log(`${tableName} table structure updated successfully`);
            }
            resolve();
          }
        });
      });
    });
  });
};

export const fixContestsTable = () => {
  return fixTable('contests', {
    start_time: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    end_time: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    status: "ENUM('upcoming', 'active', 'passed') DEFAULT 'upcoming'",
    question_count: 'INT DEFAULT 10',
    time_per_question: 'INT DEFAULT 30',
    grade_level_id: 'INT NULL',
    subject_id: 'INT NULL',
    created_by: 'INT NOT NULL DEFAULT 1',
    description: 'TEXT NULL',
    subject: 'VARCHAR(255) NULL',
    duration: 'INT NULL',
    start_date: 'DATETIME NULL',
    end_date: 'DATETIME NULL',
    prize: 'VARCHAR(255) NULL',
    rules: 'TEXT NULL',
    max_participants: 'INT NULL'
  }).then(() => {
    // Also ensure columns allow NULL (in case they were created differently)
    return new Promise((resolve) => {
      const columnsToFix = ['subject', 'duration', 'start_date', 'end_date', 'prize', 'rules', 'max_participants'];
      let done = 0;
      columnsToFix.forEach(col => {
        let sql;
        if (col === 'duration' || col === 'max_participants') {
          sql = `ALTER TABLE contests MODIFY COLUMN ${col} INT NULL`;
        } else if (col === 'start_date' || col === 'end_date') {
          sql = `ALTER TABLE contests MODIFY COLUMN ${col} DATETIME NULL`;
        } else if (col === 'rules') {
          sql = `ALTER TABLE contests MODIFY COLUMN ${col} TEXT NULL`;
        } else {
          sql = `ALTER TABLE contests MODIFY COLUMN ${col} VARCHAR(255) NULL`;
        }
        db.query(sql, (err) => {
          done++;
          if (err) console.log(`Could not modify ${col} column:`, err.message);
          if (done === columnsToFix.length) resolve();
        });
      });
    });
  });
};

export const fixQuestionsTable = () => {
  return fixTable('questions', {
    question_type: "VARCHAR(50) DEFAULT 'multiple_choice'",
    options: 'JSON NULL',
    hint: 'TEXT NULL',
    explanation: 'TEXT NULL',
    difficulty_level: "VARCHAR(50) DEFAULT 'medium'"
  });
};

export default { fixContestsTable, fixQuestionsTable };

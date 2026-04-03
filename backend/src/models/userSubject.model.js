import connection from '../config/db.js';

export const createUserSubjectsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_subjects (
      user_id INT NOT NULL,
      subject_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, subject_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      INDEX idx_user_subjects_user (user_id),
      INDEX idx_user_subjects_subject (subject_id)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('User subjects table created or exists');
        resolve();
      }
    });
  });
};

export const addUserSubject = (userId, subjectId) => {
  const sql = `INSERT IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId, subjectId], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const addUserSubjects = (userId, subjectIds) => {
  const sql = `INSERT IGNORE INTO user_subjects (user_id, subject_id) VALUES ?`;
  const values = subjectIds.map(subjectId => [userId, subjectId]);
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [values], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows);
    });
  });
};

export const removeUserSubjects = (userId) => {
  const sql = `DELETE FROM user_subjects WHERE user_id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows);
    });
  });
};

export const getUserSubjects = (userId) => {
  const sql = `
    SELECT s.* 
    FROM subjects s
    INNER JOIN user_subjects us ON s.id = us.subject_id
    WHERE us.user_id = ?
    ORDER BY s.name
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getUserSubjectIds = (userId) => {
  const sql = `SELECT subject_id FROM user_subjects WHERE user_id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results.map(row => row.subject_id));
    });
  });
};

export const updateUserSubjects = (userId, subjectIds) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction((err) => {
      if (err) return reject(err);
      
      // Remove existing subjects
      const removeSql = `DELETE FROM user_subjects WHERE user_id = ?`;
      connection.query(removeSql, [userId], (err) => {
        if (err) {
          return connection.rollback(() => reject(err));
        }
        
        // Add new subjects if any
        if (subjectIds.length > 0) {
          const addSql = `INSERT INTO user_subjects (user_id, subject_id) VALUES ?`;
          const values = subjectIds.map(subjectId => [userId, subjectId]);
          
          connection.query(addSql, [values], (err) => {
            if (err) {
              return connection.rollback(() => reject(err));
            }
            
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => reject(err));
              }
              resolve(subjectIds.length);
            });
          });
        } else {
          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => reject(err));
            }
            resolve(0);
          });
        }
      });
    });
  });
};

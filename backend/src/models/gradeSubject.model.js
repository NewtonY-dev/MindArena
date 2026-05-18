import connection from '../config/db.js';

export const createGradeSubjectsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS grade_subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grade_level_id INT NOT NULL,
      subject_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE KEY unique_grade_subject (grade_level_id, subject_id)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else { console.log('Grade subjects table created or exists'); resolve(); }
    });
  });
};

export const getSubjectsByGradeLevel = (gradeLevelId) => {
  const sql = `
    SELECT s.id, s.name
    FROM subjects s
    INNER JOIN grade_subjects gs ON s.id = gs.subject_id
    WHERE gs.grade_level_id = ?
    ORDER BY s.name
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [gradeLevelId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getSubjectIdsByGradeLevel = (gradeLevelId) => {
  const sql = `SELECT subject_id FROM grade_subjects WHERE grade_level_id = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [gradeLevelId], (err, results) => {
      if (err) reject(err);
      else resolve(results.map(r => r.subject_id));
    });
  });
};
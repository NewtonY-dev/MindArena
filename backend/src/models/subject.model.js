import connection from '../config/db.js';

export const createSubjectsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Subjects table created or exists');
        resolve();
      }
    });
  });
};

export const getAllSubjects = () => {
  const sql = `SELECT * FROM subjects ORDER BY name`;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getSubjectById = (id) => {
  const sql = `SELECT * FROM subjects WHERE id = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getSubjectsByGradeLevel = (gradeLevelId) => {
  const sql = `
    SELECT DISTINCT s.* 
    FROM subjects s
    INNER JOIN questions q ON s.id = q.subject_id
    WHERE q.grade_level_id = ?
    ORDER BY s.name
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [gradeLevelId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const createSubject = (name) => {
  const sql = `INSERT INTO subjects (name) VALUES (?)`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [name], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};
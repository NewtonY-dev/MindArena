import connection from '../config/db.js';

export const createGradeLevelsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS grade_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('GradeLevels table created or exists');
        resolve();
      }
    });
  });
};

export const getAllGradeLevels = () => {
  const sql = `SELECT * FROM grade_levels ORDER BY id`;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getGradeLevelById = (id) => {
  const sql = `SELECT * FROM grade_levels WHERE id = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const createGradeLevel = (name) => {
  const sql = `INSERT INTO grade_levels (name) VALUES (?)`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [name], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};
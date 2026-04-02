import connection from '../config/db.js';

export const createSubjectsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
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
import connection from '../config/db.js';

export const createGradeLevelsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS grade_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
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
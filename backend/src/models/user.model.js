import connection from '../config/db.js';

export const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      grade_level_id INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      points INT DEFAULT 0,
      FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Users table created or exists');
        resolve();
      }
    });
  });
};
import connection from '../config/db.js';

export const createAttemptsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_given TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Attempts table created or exists');
        resolve();
      }
    });
  });
};
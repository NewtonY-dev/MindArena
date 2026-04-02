import connection from '../config/db.js';

export const createUserSubjectsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      subject_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      UNIQUE KEY unique_user_subject (user_id, subject_id)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('UserSubjects table created or exists');
        resolve();
      }
    });
  });
};

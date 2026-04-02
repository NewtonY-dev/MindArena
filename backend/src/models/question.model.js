import connection from '../config/db.js';

export const createQuestionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grade_level_id INT NOT NULL,
      subject_id INT NOT NULL,
      content TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      hint TEXT,
      explanation TEXT,
      difficulty_level VARCHAR(50),
      FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Questions table created or exists');
        resolve();
      }
    });
  });
};
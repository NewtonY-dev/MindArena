import connection from '../config/db.js';

export const createAttemptsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_given VARCHAR(500) NOT NULL,
      is_correct BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      INDEX idx_user_attempts (user_id),
      INDEX idx_question_attempts (question_id),
      INDEX idx_user_correct (user_id, is_correct),
      INDEX idx_created_at (created_at)
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

export const createAttempt = (attemptData) => {
  const { userId, questionId, answerGiven, isCorrect } = attemptData;
  const sql = `
    INSERT INTO attempts (user_id, question_id, answer_given, is_correct)
    VALUES (?, ?, ?, ?)
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId, questionId, answerGiven, isCorrect], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getUserAttempts = (userId, limit = 50) => {
  const sql = `
    SELECT a.*, q.content as question_content, q.correct_answer, q.difficulty_level,
           gl.name as grade_level_name, s.name as subject_name
    FROM attempts a
    INNER JOIN questions q ON a.question_id = q.id
    INNER JOIN grade_levels gl ON q.grade_level_id = gl.id
    INNER JOIN subjects s ON q.subject_id = s.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId, limit], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getUserStats = (userId) => {
  const sql = `
    SELECT 
      COUNT(a.id) as total_attempts,
      SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
      ROUND(
        CASE 
          WHEN COUNT(a.id) > 0 
          THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 
          ELSE 0 
        END, 2
      ) as accuracy_percentage
    FROM attempts a
    WHERE a.user_id = ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getQuestionStats = (questionId) => {
  const sql = `
    SELECT 
      COUNT(a.id) as total_attempts,
      SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
      ROUND(
        CASE 
          WHEN COUNT(a.id) > 0 
          THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 
          ELSE 0 
        END, 2
      ) as success_rate
    FROM attempts a
    WHERE a.question_id = ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [questionId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getLeaderboardByGrade = (gradeLevelId, limit = 50) => {
  const sql = `
    SELECT 
      u.id as user_id,
      u.display_name,
      u.points,
      COUNT(a.id) as total_attempts,
      SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
      ROUND(
        CASE 
          WHEN COUNT(a.id) > 0 
          THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 
          ELSE 0 
        END, 1
      ) as accuracy
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id
    WHERE u.grade_level_id = ?
    GROUP BY u.id, u.display_name, u.points
    ORDER BY u.points DESC, 
      CASE 
        WHEN COUNT(a.id) > 0 
        THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) 
        ELSE 0 
      END DESC
    LIMIT ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [gradeLevelId, limit], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
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

export const getCorrectlyAnsweredQuestions = (userId, limit = 50) => {
  const sql = `
    SELECT a.id as attempt_id, a.question_id, a.answer_given, a.created_at,
           q.content, q.correct_answer, q.difficulty_level, q.explanation,
           gl.name as grade_level_name, s.name as subject_name
    FROM attempts a
    INNER JOIN questions q ON a.question_id = q.id
    INNER JOIN grade_levels gl ON q.grade_level_id = gl.id
    INNER JOIN subjects s ON q.subject_id = s.id
    WHERE a.user_id = ? AND a.is_correct = TRUE
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

export const submitPracticeAttempt = ({ userId, questionId, answerGiven }) => {
  return new Promise((resolve, reject) => {
    connection.getConnection((connectionError, dbConnection) => {
      if (connectionError) {
        reject(connectionError);
        return;
      }

      dbConnection.beginTransaction((transactionError) => {
        if (transactionError) {
          dbConnection.release();
          reject(transactionError);
          return;
        }

        dbConnection.query(
          'SELECT correct_answer, hint FROM questions WHERE id = ?',
          [questionId],
          (questionError, questionResults) => {
            if (questionError) {
              return dbConnection.rollback(() => {
                dbConnection.release();
                reject(questionError);
              });
            }

            if (questionResults.length === 0) {
              return dbConnection.rollback(() => {
                dbConnection.release();
                resolve(null);
              });
            }

            const question = questionResults[0];
            const isCorrect = question.correct_answer.toLowerCase().trim() === answerGiven.toLowerCase().trim();

            dbConnection.query(
              'INSERT INTO attempts (user_id, question_id, answer_given, is_correct, created_at) VALUES (?, ?, ?, ?, NOW())',
              [userId, questionId, answerGiven, isCorrect],
              (attemptError, attemptResults) => {
                if (attemptError) {
                  return dbConnection.rollback(() => {
                    dbConnection.release();
                    reject(attemptError);
                  });
                }

                dbConnection.query(
                  `SELECT id FROM attempts
                   WHERE user_id = ? AND question_id = ? AND is_correct = TRUE
                   AND id != ?
                   LIMIT 1`,
                  [userId, questionId, attemptResults.insertId],
                  (previousError, previousResults) => {
                    if (previousError) {
                      return dbConnection.rollback(() => {
                        dbConnection.release();
                        reject(previousError);
                      });
                    }

                    const alreadyAnswered = previousResults.length > 0;

                    const finalize = (pointsAwarded) => {
                      dbConnection.query('SELECT points FROM users WHERE id = ?', [userId], (pointsError, pointsResults) => {
                        if (pointsError) {
                          return dbConnection.rollback(() => {
                            dbConnection.release();
                            reject(pointsError);
                          });
                        }

                        const totalPoints = pointsResults[0]?.points || 0;
                        dbConnection.commit((commitError) => {
                          if (commitError) {
                            return dbConnection.rollback(() => {
                              dbConnection.release();
                              reject(commitError);
                            });
                          }

                          dbConnection.release();
                          resolve({
                            isCorrect,
                            correctAnswer: question.correct_answer,
                            hint: question.hint,
                            pointsAwarded,
                            totalPoints,
                            alreadyAnswered
                          });
                        });
                      });
                    };

                    if (isCorrect && !alreadyAnswered) {
                      dbConnection.query(
                        'UPDATE users SET points = points + 1 WHERE id = ?',
                        [userId],
                        (updateError) => {
                          if (updateError) {
                            return dbConnection.rollback(() => {
                              dbConnection.release();
                              reject(updateError);
                            });
                          }

                          finalize(1);
                        }
                      );
                    } else {
                      finalize(0);
                    }
                  }
                );
              }
            );
          }
        );
      });
    });
  });
};

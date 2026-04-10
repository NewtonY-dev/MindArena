import db from "../config/db.js";

export const getQuestions = async (req, res) => {
  try {
    console.log('getQuestions called with userId:', req.user?.id);
    console.log('query params:', req.query);
    
    const userId = req.user?.id;
    const { subjectId } = req.query;
    
    if (!userId) {
      console.log('Unauthorized - no userId');
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Get user's grade level and subjects
      const userSql = `
        SELECT grade_level_id 
        FROM users 
        WHERE id = ?
      `;
      
      db.query(userSql, [userId], (err, userResults) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        
        console.log('User query results:', userResults);
        
        if (userResults.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const gradeLevelId = userResults[0].grade_level_id;
        console.log('User grade level:', gradeLevelId);
        
        if (!gradeLevelId) {
          return res.status(400).json({ 
            error: "Grade level not set. Please complete your profile setup.",
            code: "PROFILE_INCOMPLETE"
          });
        }
        
        let questionsSql;
        let params;
        
        if (subjectId) {
          // Filter by specific subject - exclude contest and correctly answered
          questionsSql = `
            SELECT q.id, q.content, q.difficulty_level, q.hint
            FROM questions q
            LEFT JOIN contest_questions cq ON q.id = cq.question_id
            LEFT JOIN attempts a ON q.id = a.question_id 
              AND a.user_id = ? AND a.is_correct = TRUE
            WHERE q.grade_level_id = ? AND q.subject_id = ? 
              AND cq.question_id IS NULL AND a.question_id IS NULL
            ORDER BY q.difficulty_level, RAND()
            LIMIT 20
          `;
          params = [userId, gradeLevelId, subjectId];
          console.log('Fetching PRACTICE questions for grade:', gradeLevelId, 'subject:', subjectId);
        } else {
          // Get questions from all user's subjects - exclude contest and correctly answered
          questionsSql = `
            SELECT DISTINCT q.id, q.content, q.difficulty_level, q.hint
            FROM questions q
            INNER JOIN user_subjects us ON q.subject_id = us.subject_id
            LEFT JOIN contest_questions cq ON q.id = cq.question_id
            LEFT JOIN attempts a ON q.id = a.question_id 
              AND a.user_id = ? AND a.is_correct = TRUE
            WHERE q.grade_level_id = ? AND us.user_id = ? 
              AND cq.question_id IS NULL AND a.question_id IS NULL
            ORDER BY q.difficulty_level, RAND()
            LIMIT 20
          `;
          params = [userId, gradeLevelId, userId];
          console.log('Fetching PRACTICE questions for grade:', gradeLevelId, 'user:', userId);
        }
        
        db.query(questionsSql, params, (err, questionResults) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal server error" });
          }
          
          console.log('Questions query results:', questionResults.length, 'questions found');
          
          if (questionResults.length === 0) {
            // Fallback to all practice questions - exclude contest and correctly answered
            const fallbackSql = `
              SELECT q.id, q.content, q.difficulty_level, q.hint
              FROM questions q
              LEFT JOIN contest_questions cq ON q.id = cq.question_id
              LEFT JOIN attempts a ON q.id = a.question_id 
                AND a.user_id = ? AND a.is_correct = TRUE
              WHERE q.grade_level_id = ? AND cq.question_id IS NULL AND a.question_id IS NULL
              ORDER BY q.difficulty_level, RAND()
              LIMIT 20
            `;
            
            db.query(fallbackSql, [userId, gradeLevelId], (err, fallbackResults) => {
              if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Internal server error" });
              }
              
              console.log('Fallback query results:', fallbackResults.length, 'questions found');
              
              if (fallbackResults.length === 0) {
                return res.status(404).json({ error: "No questions found" });
              }
              
              const questions = fallbackResults.map(q => ({
                id: q.id,
                content: q.content,
                difficultyLevel: q.difficulty_level,
                hint: q.hint
              }));
              
              console.log('Returning fallback questions:', questions.length);
              res.json({ questions });
            });
            return;
          }
          
          const questions = questionResults.map(q => ({
            id: q.id,
            content: q.content,
            difficultyLevel: q.difficulty_level,
            hint: q.hint
          }));
          
          console.log('Returning questions:', questions.length);
          res.json({ questions });
        });
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    console.error("Error in getQuestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCorrectlyAnsweredQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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
      LIMIT 50
    `;
    
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      const questions = results.map(r => ({
        attemptId: r.attempt_id,
        questionId: r.question_id,
        content: r.content,
        userAnswer: r.answer_given,
        correctAnswer: r.correct_answer,
        difficultyLevel: r.difficulty_level,
        explanation: r.explanation,
        gradeLevelName: r.grade_level_name,
        subjectName: r.subject_name,
        answeredAt: r.created_at
      }));
      
      res.json({ questions, total: questions.length });
    });
  } catch (error) {
    console.error("Error in getCorrectlyAnsweredQuestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { questionId, answerGiven } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!questionId || answerGiven === undefined) {
      return res.status(400).json({ error: "questionId and answerGiven are required" });
    }
    
    // Use normal transaction
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Transaction error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        
        // Get question details
        const questionSql = `
          SELECT correct_answer, hint
          FROM questions 
          WHERE id = ?
        `;
        
        connection.query(questionSql, [questionId], (err, questionResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Database error:", err);
              res.status(500).json({ error: "Internal server error" });
            });
          }
          
          if (questionResults.length === 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({ error: "Question not found" });
            });
          }
          
          const question = questionResults[0];
          const isCorrect = question.correct_answer.toLowerCase().trim() === answerGiven.toLowerCase().trim();
          
          // Create attempt record
          const attemptSql = `
            INSERT INTO attempts (user_id, question_id, answer_given, is_correct, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `;
          
          connection.query(attemptSql, [userId, questionId, answerGiven, isCorrect], (err, attemptResults) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Database error:", err);
                res.status(500).json({ error: "Internal server error" });
              });
            }
            
            let pointsAwarded = 0;
            
            // Award points if correct (only if not already answered correctly before)
            if (isCorrect) {
              // Check if user already answered this question correctly before this attempt
              const checkPreviousSql = `
                SELECT id FROM attempts 
                WHERE user_id = ? AND question_id = ? AND is_correct = TRUE
                AND id != ?
                LIMIT 1
              `;
              
              connection.query(checkPreviousSql, [userId, questionId, attemptResults.insertId], (err, previousResults) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Database error:", err);
                    res.status(500).json({ error: "Internal server error" });
                  });
                }
                
                const hasPreviousCorrect = previousResults.length > 0;
                
                if (!hasPreviousCorrect) {
                  // First time correct - award points
                  const updatePointsSql = `
                    UPDATE users 
                    SET points = points + 1 
                    WHERE id = ?
                  `;
                  
                  connection.query(updatePointsSql, [userId], (err, updateResults) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Database error:", err);
                        res.status(500).json({ error: "Internal server error" });
                      });
                    }
                    
                    pointsAwarded = 1;
                    finishResponse();
                  });
                } else {
                  // Already answered correctly before - no points
                  pointsAwarded = 0;
                  finishResponse();
                }
                
                function finishResponse() {
                  // Get current total points
                  const getPointsSql = `SELECT points FROM users WHERE id = ?`;
                  
                  connection.query(getPointsSql, [userId], (err, pointsResults) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Database error:", err);
                        res.status(500).json({ error: "Internal server error" });
                      });
                    }
                    
                    const totalPoints = pointsResults[0].points;
                    
                    connection.commit((err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Commit error:", err);
                          res.status(500).json({ error: "Internal server error" });
                        });
                      }
                      
                      connection.release();
                      res.json({
                        isCorrect,
                        correctAnswer: question.correct_answer,
                        hint: question.hint,
                        pointsAwarded,
                        totalPoints,
                        alreadyAnswered: hasPreviousCorrect
                      });
                    });
                  });
                }
              });
            } else {
              // Get current points for incorrect answer
              const getPointsSql = `SELECT points FROM users WHERE id = ?`;
              
              connection.query(getPointsSql, [userId], (err, pointsResults) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Database error:", err);
                    res.status(500).json({ error: "Internal server error" });
                  });
                }
                
                const totalPoints = pointsResults[0].points;
                
                connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Commit error:", err);
                      res.status(500).json({ error: "Internal server error" });
                    });
                  }
                  
                  connection.release();
                  res.json({
                    isCorrect,
                    correctAnswer: question.correct_answer,
                    hint: question.hint,
                    pointsAwarded: 0,
                    totalPoints
                  });
                });
              });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error("Error in submitAnswer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
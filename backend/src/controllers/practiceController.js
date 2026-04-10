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
          console.log('User grade level not set - using default grade 5');
          // Use default grade level 5 for testing
          const defaultGradeLevelId = 5;
          
          let questionsSql;
          let params;
          
          if (subjectId) {
            // Filter by specific subject - exclude contest questions
            questionsSql = `
              SELECT q.id, q.content, q.difficulty_level, q.hint
              FROM questions q
              LEFT JOIN contest_questions cq ON q.id = cq.question_id
              WHERE q.grade_level_id = ? AND q.subject_id = ? AND cq.question_id IS NULL
              ORDER BY q.difficulty_level, RAND()
              LIMIT 20
            `;
            params = [defaultGradeLevelId, subjectId];
            console.log('Fetching PRACTICE questions for default grade:', defaultGradeLevelId, 'subject:', subjectId);
          } else {
            // Get all practice questions for default grade level - exclude contest questions
            questionsSql = `
              SELECT q.id, q.content, q.difficulty_level, q.hint
              FROM questions q
              LEFT JOIN contest_questions cq ON q.id = cq.question_id
              WHERE q.grade_level_id = ? AND cq.question_id IS NULL
              ORDER BY q.difficulty_level, RAND()
              LIMIT 20
            `;
            params = [defaultGradeLevelId];
            console.log('Fetching PRACTICE questions for default grade:', defaultGradeLevelId);
          }
          
          db.query(questionsSql, params, (err, questionResults) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ error: "Internal server error" });
            }
            
            console.log('Questions query results:', questionResults.length, 'questions found');
            
            if (questionResults.length === 0) {
              return res.status(404).json({ error: "No questions found" });
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
          return;
        }
        
        let questionsSql;
        let params;
        
        if (subjectId) {
          // Filter by specific subject - exclude contest questions
          questionsSql = `
            SELECT q.id, q.content, q.difficulty_level, q.hint
            FROM questions q
            LEFT JOIN contest_questions cq ON q.id = cq.question_id
            WHERE q.grade_level_id = ? AND q.subject_id = ? AND cq.question_id IS NULL
            ORDER BY q.difficulty_level, RAND()
            LIMIT 20
          `;
          params = [gradeLevelId, subjectId];
          console.log('Fetching PRACTICE questions for grade:', gradeLevelId, 'subject:', subjectId);
        } else {
          // Get questions from all user's subjects - exclude contest questions
          questionsSql = `
            SELECT DISTINCT q.id, q.content, q.difficulty_level, q.hint
            FROM questions q
            INNER JOIN user_subjects us ON q.subject_id = us.subject_id
            LEFT JOIN contest_questions cq ON q.id = cq.question_id
            WHERE q.grade_level_id = ? AND us.user_id = ? AND cq.question_id IS NULL
            ORDER BY q.difficulty_level, RAND()
            LIMIT 20
          `;
          params = [gradeLevelId, userId];
          console.log('Fetching PRACTICE questions for grade:', gradeLevelId, 'user:', userId);
        }
        
        db.query(questionsSql, params, (err, questionResults) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal server error" });
          }
          
          console.log('Questions query results:', questionResults.length, 'questions found');
          
          if (questionResults.length === 0) {
            // Fallback to all practice questions for the grade level - exclude contest questions
            const fallbackSql = `
              SELECT q.id, q.content, q.difficulty_level, q.hint
              FROM questions q
              LEFT JOIN contest_questions cq ON q.id = cq.question_id
              WHERE q.grade_level_id = ? AND cq.question_id IS NULL
              ORDER BY q.difficulty_level, RAND()
              LIMIT 20
            `;
            
            db.query(fallbackSql, [gradeLevelId], (err, fallbackResults) => {
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
            
            // Award points if correct
            if (isCorrect) {
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
                
                // Get updated total points
                const getPointsSql = `SELECT points FROM users WHERE id = ?`;
                
                connection.query(getPointsSql, [userId], (err, pointsResults) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Database error:", err);
                      res.status(500).json({ error: "Internal server error" });
                    });
                  }
                  
                  pointsAwarded = 1;
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
                      totalPoints
                    });
                  });
                });
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
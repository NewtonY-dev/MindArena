import db from "../config/db.js";

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
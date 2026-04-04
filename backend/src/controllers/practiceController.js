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

    // Try to get questions from database, fallback to mock data if database fails
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
          console.log('Database error, using mock data');
          return getMockQuestions(req, res);
        }
        
        console.log('User query results:', userResults);
        
        if (userResults.length === 0) {
          console.log('User not found, using mock data');
          return getMockQuestions(req, res);
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
              console.log('Database error, using mock data');
              return getMockQuestions(req, res);
            }
            
            console.log('Questions query results:', questionResults.length, 'questions found');
            
            if (questionResults.length === 0) {
              console.log('No questions found even for default grade, using mock data');
              return getMockQuestions(req, res);
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
            console.log('Database error, using mock data');
            return getMockQuestions(req, res);
          }
          
          console.log('Questions query results:', questionResults.length, 'questions found');
          
          if (questionResults.length === 0) {
            console.log('No questions found for user subjects, trying all PRACTICE questions for grade level');
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
                console.log('Database error, using mock data');
                return getMockQuestions(req, res);
              }
              
              console.log('Fallback query results:', fallbackResults.length, 'questions found');
              
              if (fallbackResults.length === 0) {
                console.log('No questions found at all, using mock data');
                return getMockQuestions(req, res);
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
      console.log('Database connection failed, using mock data');
      return getMockQuestions(req, res);
    }
  } catch (error) {
    console.error("Error in getQuestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mock questions fallback
const getMockQuestions = (req, res) => {
  console.log('Returning mock questions');
  const mockQuestions = [
    {
      id: 1,
      content: "What is 15 + 27?",
      difficultyLevel: "easy",
      hint: "Add tens and ones separately.",
      subjectId: 1 // Mathematics
    },
    {
      id: 2,
      content: "What is 8 × 7?",
      difficultyLevel: "easy",
      hint: "Think of it as 8 groups of 7.",
      subjectId: 1 // Mathematics
    },
    {
      id: 3,
      content: "What is 144 ÷ 12?",
      difficultyLevel: "medium",
      hint: "Think of what number multiplied by 12 equals 144.",
      subjectId: 1 // Mathematics
    },
    {
      id: 4,
      content: "Solve for x: 3x = 12",
      difficultyLevel: "medium",
      hint: "Divide both sides by 3.",
      subjectId: 1 // Mathematics
    },
    {
      id: 5,
      content: "What is the past tense of 'go'?",
      difficultyLevel: "easy",
      hint: "This is an irregular verb.",
      subjectId: 2 // English
    },
    {
      id: 6,
      content: "Which is a noun: run, running, or runner?",
      difficultyLevel: "easy",
      hint: "A noun names a person, place, or thing.",
      subjectId: 2 // English
    },
    {
      id: 7,
      content: "Complete the sentence: The dog ___ over the fence.",
      difficultyLevel: "easy",
      hint: "Use past tense for a completed action.",
      subjectId: 2 // English
    },
    {
      id: 8,
      content: "What is the plural of 'child'?",
      difficultyLevel: "medium",
      hint: "This is an irregular plural.",
      subjectId: 2 // English
    },
    {
      id: 9,
      content: "Solve: 2x² + 5x - 3 = 0",
      difficultyLevel: "hard",
      hint: "Use the quadratic formula.",
      subjectId: 6 // Physics
    },
    {
      id: 10,
      content: "What is the derivative of x³ + 2x?",
      difficultyLevel: "hard",
      hint: "Apply the power rule.",
      subjectId: 6 // Physics
    },
    {
      id: 11,
      content: "What is the capital city of France?",
      difficultyLevel: "easy",
      hint: "Think of the most famous city in France.",
      subjectId: 4 // Geography
    },
    {
      id: 12,
      content: "Which continent is Egypt located in?",
      difficultyLevel: "easy",
      hint: "Egypt is known for its pyramids.",
      subjectId: 4 // Geography
    },
    {
      id: 13,
      content: "What is the largest ocean on Earth?",
      difficultyLevel: "medium",
      hint: "It covers about one-third of the Earth's surface.",
      subjectId: 4 // Geography
    },
    {
      id: 14,
      content: "Which planet is known as the Red Planet?",
      difficultyLevel: "easy",
      hint: "This planet has iron oxide on its surface.",
      subjectId: 3 // Science
    },
    {
      id: 15,
      content: "What is H2O commonly known as?",
      difficultyLevel: "easy",
      hint: "You drink it every day.",
      subjectId: 7 // Chemistry
    }
  ];

  // Apply subject filter if provided
  const { subjectId } = req.query;
  let filteredQuestions = mockQuestions;
  
  if (subjectId) {
    filteredQuestions = mockQuestions.filter(q => q.subjectId === parseInt(subjectId));
    console.log(`Filtered ${filteredQuestions.length} questions for subjectId: ${subjectId}`);
  } else {
    console.log(`Returning all ${filteredQuestions.length} mock questions`);
  }

  res.json({ questions: filteredQuestions });
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
    
    // Check if database is available, otherwise use mock data
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock answer checking');
      
      // Mock answer checking
      const mockAnswers = {
        1: "42",
        2: "56", 
        3: "12",
        4: "4",
        5: "went",
        6: "runner",
        7: "jumped",
        8: "children",
        9: "x = 0.5, x = -3",
        10: "3x² + 2",
        11: "Paris",
        12: "Africa",
        13: "Pacific Ocean",
        14: "Mars",
        15: "Water"
      };
      
      const correctAnswer = mockAnswers[questionId] || "unknown";
      const isCorrect = correctAnswer.toLowerCase().trim() === answerGiven.toLowerCase().trim();
      
      return res.json({
        isCorrect,
        correctAnswer,
        hint: "This is a mock hint since database is not available",
        pointsAwarded: isCorrect ? 1 : 0,
        totalPoints: isCorrect ? 1 : 0
      });
    }
    
    // Database is available, use normal transaction
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

// Helper function to check if database is available
const isDatabaseAvailable = () => {
  try {
    return db && db.query;
  } catch (error) {
    return false;
  }
};
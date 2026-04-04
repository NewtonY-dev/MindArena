import connection from '../config/db.js';

export const createQuestionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grade_level_id INT NOT NULL,
      subject_id INT NOT NULL,
      content TEXT NOT NULL,
      question_type VARCHAR(20) DEFAULT 'short_answer',
      options JSON,
      correct_answer VARCHAR(500) NOT NULL,
      hint TEXT,
      explanation TEXT,
      difficulty_level VARCHAR(20) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      INDEX idx_grade_subject (grade_level_id, subject_id),
      INDEX idx_difficulty (difficulty_level),
      INDEX idx_question_type (question_type)
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

export const getQuestionsByGradeAndSubject = (gradeLevelId, subjectId = null) => {
  let sql = `
    SELECT q.id, q.content, q.difficulty_level, q.hint,
           gl.name as grade_level_name, s.name as subject_name,
           q.question_type, q.options
    FROM questions q
    INNER JOIN grade_levels gl ON q.grade_level_id = gl.id
    INNER JOIN subjects s ON q.subject_id = s.id
    WHERE q.grade_level_id = ?
  `;
  let params = [gradeLevelId];
  
  if (subjectId) {
    sql += ` AND q.subject_id = ?`;
    params.push(subjectId);
  }
  
  sql += ` ORDER BY q.difficulty_level, RAND() LIMIT 20`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getQuestionsByUserSubjects = (userId) => {
  const sql = `
    SELECT DISTINCT q.id, q.content, q.difficulty_level, q.hint,
           gl.name as grade_level_name, s.name as subject_name
    FROM questions q
    INNER JOIN user_subjects us ON q.subject_id = us.subject_id
    INNER JOIN users u ON us.user_id = u.id AND u.id = ?
    INNER JOIN grade_levels gl ON q.grade_level_id = gl.id
    INNER JOIN subjects s ON q.subject_id = s.id
    WHERE q.grade_level_id = u.grade_level_id
    ORDER BY q.difficulty_level, RAND()
    LIMIT 20
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getQuestionById = (id) => {
  const sql = `
    SELECT q.*, gl.name as grade_level_name, s.name as subject_name
    FROM questions q
    INNER JOIN grade_levels gl ON q.grade_level_id = gl.id
    INNER JOIN subjects s ON q.subject_id = s.id
    WHERE q.id = ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const createQuestion = (questionData) => {
  const { gradeLevelId, subjectId, content, correctAnswer, hint, explanation, difficultyLevel = 'medium', questionType = 'short_answer', options } = questionData;
  const sql = `
    INSERT INTO questions (grade_level_id, subject_id, content, question_type, options, correct_answer, hint, explanation, difficulty_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  // Convert undefined to null for database compatibility
  const hintValue = hint === undefined ? null : hint;
  const explanationValue = explanation === undefined ? null : explanation;
  const optionsValue = options ? JSON.stringify(options) : null;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [gradeLevelId, subjectId, content, questionType, optionsValue, correctAnswer, hintValue, explanationValue, difficultyLevel], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getAllQuestions = () => {
  const sql = `
    SELECT q.*, gl.name as grade_level_name, s.name as subject_name
    FROM questions q
    INNER JOIN grade_levels gl ON q.grade_level_id = gl.id
    INNER JOIN subjects s ON q.subject_id = s.id
    ORDER BY q.id DESC
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const updateQuestion = (questionId, questionData) => {
  const { content, correctAnswer, hint, explanation, difficultyLevel, questionType, options } = questionData;
  const sql = `
    UPDATE questions 
    SET content = ?, correct_answer = ?, hint = ?, explanation = ?, difficulty_level = ?, question_type = ?, options = ?
    WHERE id = ?
  `;
  
  // Convert undefined to null for database compatibility
  const hintValue = hint === undefined ? null : hint;
  const explanationValue = explanation === undefined ? null : explanation;
  const optionsValue = options ? JSON.stringify(options) : null;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [content, correctAnswer, hintValue, explanationValue, difficultyLevel, questionType, optionsValue, questionId], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const deleteQuestion = (questionId) => {
  const sql = `DELETE FROM questions WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [questionId], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};
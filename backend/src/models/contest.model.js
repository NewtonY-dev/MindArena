import db from '../config/db.js';

export const createContestsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      grade_level_id INT NULL,
      subject_id INT NULL,
      question_count INT DEFAULT 10,
      time_per_question INT DEFAULT 30,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status ENUM('upcoming', 'active', 'passed') DEFAULT 'upcoming',
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE SET NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_status (status),
      INDEX idx_start_time (start_time),
      INDEX idx_end_time (end_time),
      INDEX idx_grade_level (grade_level_id),
      INDEX idx_subject (subject_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Contests table created or exists');
        resolve();
      }
    });
  });
};

export const createContestQuestionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contest_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contest_id INT NOT NULL,
      question_id INT NOT NULL,
      question_order INT NOT NULL,
      FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_contest_question_order (contest_id, question_order),
      INDEX idx_contest_questions (contest_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Contest questions table created or exists');
        resolve();
      }
    });
  });
};

export const createContestParticipantsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contest_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contest_id INT NOT NULL,
      user_id INT NOT NULL,
      score INT DEFAULT 0,
      correct_answers INT DEFAULT 0,
      total_answered INT DEFAULT 0,
      time_spent_seconds INT DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP NULL,
      FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_contest_user (contest_id, user_id),
      INDEX idx_contest_participants (contest_id),
      INDEX idx_user_contests (user_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Contest participants table created or exists');
        resolve();
      }
    });
  });
};

export const createContestAttemptsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contest_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contest_id INT NOT NULL,
      user_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_given VARCHAR(500) NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE,
      points_awarded INT DEFAULT 0,
      time_taken INT NULL,
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      INDEX idx_contest_user_attempts (contest_id, user_id),
      INDEX idx_contest_question (contest_id, question_id),
      INDEX idx_user_attempts (user_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Contest attempts table created or exists');
        resolve();
      }
    });
  });
};

// CRUD Operations

export const createContest = (contestData) => {
  const { 
    title, 
    description, 
    gradeLevelId, 
    subjectId, 
    questionCount, 
    timePerQuestion, 
    startTime, 
    endTime, 
    createdBy,
    subject
  } = contestData;
  
  const sql = `
    INSERT INTO contests 
      (title, description, grade_level_id, subject_id, question_count, time_per_question, start_time, end_time, created_by, status, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [
      title, description, gradeLevelId, subjectId, questionCount, 
      timePerQuestion, startTime, endTime, createdBy, subject || null
    ], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getContestById = (id) => {
  const sql = `
    SELECT 
      c.*,
      gl.name as grade_level_name,
      s.name as subject_name,
      u.display_name as created_by_name
    FROM contests c
    LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getAllContests = (filters = {}) => {
  const { status, gradeLevelId, subjectId, limit = 50 } = filters;
  
  let sql = `
    SELECT 
      c.*,
      gl.name as grade_level_name,
      s.name as subject_name,
      u.display_name as created_by_name,
      COUNT(cp.id) as participant_count
    FROM contests c
    LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN contest_participants cp ON c.id = cp.contest_id
  `;
  
  const conditions = [];
  const params = [];
  
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  
  if (gradeLevelId) {
    conditions.push('c.grade_level_id = ?');
    params.push(gradeLevelId);
  }
  
  if (subjectId) {
    conditions.push('c.subject_id = ?');
    params.push(subjectId);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' GROUP BY c.id ORDER BY c.start_time DESC LIMIT ?';
  params.push(parseInt(limit));
  
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getContestsByStatus = (status, gradeLevelId = null, limit = 20) => {
  let sql = `
    SELECT 
      c.*,
      gl.name as grade_level_name,
      s.name as subject_name,
      u.display_name as created_by_name,
      COUNT(cp.id) as participant_count
    FROM contests c
    LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
    LEFT JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN contest_participants cp ON c.id = cp.contest_id
    WHERE c.status = ?
  `;
  
  const params = [status];
  
  if (gradeLevelId) {
    sql += ' AND c.grade_level_id = ?';
    params.push(gradeLevelId);
  }
  
  sql += ' GROUP BY c.id ORDER BY c.start_time DESC LIMIT ?';
  params.push(parseInt(limit));
  
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const updateContest = (id, contestData) => {
  const { 
    title, 
    description, 
    gradeLevelId, 
    subjectId, 
    questionCount, 
    timePerQuestion, 
    startTime, 
    endTime 
  } = contestData;
  
  const sql = `
    UPDATE contests 
    SET title = ?, description = ?, grade_level_id = ?, subject_id = ?, 
        question_count = ?, time_per_question = ?, start_time = ?, end_time = ?
    WHERE id = ?
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [
      title, description, gradeLevelId, subjectId, questionCount,
      timePerQuestion, startTime, endTime, id
    ], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const updateContestStatus = (id, status) => {
  const sql = `UPDATE contests SET status = ? WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [status, id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const deleteContest = (id) => {
  const sql = `DELETE FROM contests WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const assignQuestionsToContest = (contestId, questionIds) => {
  const values = questionIds.map((qid, index) => [contestId, qid, index + 1]);
  const placeholders = values.map(() => '(?, ?, ?)').join(', ');
  const flatValues = values.flat();
  
  const sql = `
    INSERT INTO contest_questions (contest_id, question_id, question_order)
    VALUES ${placeholders}
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, flatValues, (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows);
    });
  });
};

export const getContestQuestions = (contestId) => {
  const sql = `
    SELECT q.*, cq.question_order
    FROM questions q
    INNER JOIN contest_questions cq ON q.id = cq.question_id
    WHERE cq.contest_id = ?
    ORDER BY cq.question_order
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [contestId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const refreshContestStatus = () => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  const sql = `
    UPDATE contests 
    SET status = CASE 
      WHEN end_time < ? THEN 'passed'
      WHEN start_time <= ? AND end_time >= ? THEN 'active'
      ELSE 'upcoming'
    END
    WHERE status != 'passed' OR (status = 'passed' AND end_time >= ?)
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [now, now, now, now], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows);
    });
  });
};

// Contest Participant Operations

export const createContestParticipant = (participantData) => {
  const { contestId, userId, score = 0, correctAnswers = 0, totalAnswered = 0, currentQuestionIndex = 0, timeSpentSeconds = 0 } = participantData;
  
  const sql = `
    INSERT INTO contest_participants 
      (contest_id, user_id, score, correct_answers, total_answered, current_question_index, time_spent_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [contestId, userId, score, correctAnswers, totalAnswered, currentQuestionIndex, timeSpentSeconds], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getContestParticipant = (contestId, userId) => {
  const sql = `SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?`;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [contestId, userId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const updateContestParticipant = (id, participantData) => {
  const { score, correctAnswers, totalAnswered, currentQuestionIndex, timeSpentSeconds, finishedAt } = participantData;
  
  let sql = `UPDATE contest_participants SET `;
  const updates = [];
  const values = [];
  
  if (score !== undefined) {
    updates.push('score = ?');
    values.push(score);
  }
  if (correctAnswers !== undefined) {
    updates.push('correct_answers = ?');
    values.push(correctAnswers);
  }
  if (totalAnswered !== undefined) {
    updates.push('total_answered = ?');
    values.push(totalAnswered);
  }
  if (currentQuestionIndex !== undefined) {
    updates.push('current_question_index = ?');
    values.push(currentQuestionIndex);
  }
  if (timeSpentSeconds !== undefined) {
    updates.push('time_spent_seconds = ?');
    values.push(timeSpentSeconds);
  }
  if (finishedAt !== undefined) {
    updates.push('finished_at = ?');
    values.push(finishedAt);
  }
  
  if (updates.length === 0) {
    return Promise.resolve(false);
  }
  
  sql += updates.join(', ') + ' WHERE id = ?';
  values.push(id);
  
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

// Contest Attempt Operations

export const createContestAttempt = (attemptData) => {
  const { contestId, userId, questionId, answerGiven, isCorrect, pointsAwarded, timeTaken } = attemptData;
  
  const sql = `
    INSERT INTO contest_attempts 
      (contest_id, user_id, question_id, answer_given, is_correct, points_awarded, time_taken)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [contestId, userId, questionId, answerGiven, isCorrect, pointsAwarded, timeTaken], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getContestAttempts = (contestId, userId) => {
  const sql = `
    SELECT ca.*, q.content as question_content, q.correct_answer
    FROM contest_attempts ca
    INNER JOIN questions q ON ca.question_id = q.id
    WHERE ca.contest_id = ? AND ca.user_id = ?
    ORDER BY ca.answered_at
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, [contestId, userId], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

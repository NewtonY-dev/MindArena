import db from '../config/db.js';

export const createChallengeRoomsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS challenge_rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_code VARCHAR(10) NOT NULL UNIQUE,
      host_id INT NOT NULL,
      opponent_id INT NULL,
      subject VARCHAR(50) NULL,
      difficulty VARCHAR(20) DEFAULT 'medium',
      question_count INT DEFAULT 10,
      time_per_question INT DEFAULT 10,
      status ENUM('waiting', 'in_progress', 'completed', 'abandoned') DEFAULT 'waiting',
      winner_id INT NULL,
      started_at TIMESTAMP NULL,
      ended_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_room_code (room_code),
      INDEX idx_status (status),
      INDEX idx_host (host_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Challenge rooms table created or exists');
        resolve();
      }
    });
  });
};

export const createChallengeParticipantsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS challenge_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_id INT NOT NULL,
      user_id INT NOT NULL,
      score INT DEFAULT 0,
      correct_answers INT DEFAULT 0,
      total_answered INT DEFAULT 0,
      current_question_index INT DEFAULT 0,
      time_spent_seconds INT DEFAULT 0,
      is_ready BOOLEAN DEFAULT FALSE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP NULL,
      FOREIGN KEY (room_id) REFERENCES challenge_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_room_user (room_id, user_id),
      INDEX idx_room_participants (room_id),
      INDEX idx_user_challenges (user_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Challenge participants table created or exists');
        resolve();
      }
    });
  });
};

export const createChallengeQuestionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS challenge_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_id INT NOT NULL,
      question_id INT NOT NULL,
      question_order INT NOT NULL,
      FOREIGN KEY (room_id) REFERENCES challenge_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      UNIQUE KEY unique_room_question_order (room_id, question_order),
      INDEX idx_room_questions (room_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Challenge questions table created or exists');
        resolve();
      }
    });
  });
};

export const createChallengeAttemptsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS challenge_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_id INT NOT NULL,
      user_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_given VARCHAR(500) NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE,
      points_awarded INT DEFAULT 0,
      time_taken INT NULL,
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES challenge_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      INDEX idx_room_user_attempts (room_id, user_id),
      INDEX idx_room_question (room_id, question_id),
      INDEX idx_user_attempts (user_id)
    )
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Challenge attempts table created or exists');
        resolve();
      }
    });
  });
};

export const createChallengeLeaderboardView = () => {
  const sql = `
    CREATE OR REPLACE VIEW challenge_leaderboard AS
    SELECT 
      cr.id as room_id,
      cr.room_code,
      cr.status,
      u1.id as host_id,
      u1.display_name as host_name,
      cp1.score as host_score,
      cp1.correct_answers as host_correct,
      u2.id as opponent_id,
      u2.display_name as opponent_name,
      cp2.score as opponent_score,
      cp2.correct_answers as opponent_correct,
      CASE 
        WHEN cp1.score > cp2.score THEN u1.display_name
        WHEN cp2.score > cp1.score THEN u2.display_name
        WHEN cp1.score = cp2.score AND cp1.score > 0 THEN 'Tie'
        ELSE NULL
      END as current_leader
    FROM challenge_rooms cr
    LEFT JOIN challenge_participants cp1 ON cr.id = cp1.room_id AND cp1.user_id = cr.host_id
    LEFT JOIN challenge_participants cp2 ON cr.id = cp2.room_id AND cp2.user_id = cr.opponent_id
    LEFT JOIN users u1 ON cr.host_id = u1.id
    LEFT JOIN users u2 ON cr.opponent_id = u2.id
    WHERE cr.status IN ('in_progress', 'completed')
  `;
  
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) {
        // View might already exist, try dropping and recreating
        const dropSql = 'DROP VIEW IF EXISTS challenge_leaderboard';
        db.query(dropSql, (dropErr) => {
          if (dropErr) {
            console.log('Challenge leaderboard view may already exist or error:', dropErr.message);
            resolve(); // Continue even if view fails
          } else {
            db.query(sql, (recreateErr) => {
              if (recreateErr) {
                console.log('Challenge leaderboard view recreation failed:', recreateErr.message);
              } else {
                console.log('Challenge leaderboard view created successfully');
              }
              resolve();
            });
          }
        });
      } else {
        console.log('Challenge leaderboard view created or exists');
        resolve();
      }
    });
  });
};

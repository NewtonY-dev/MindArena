-- Challenge Rooms Table
-- Stores 1v1 challenge room information
CREATE TABLE challenge_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(10) NOT NULL UNIQUE COMMENT 'Unique room code for joining (e.g., A7K9P2)',
    host_id INT NOT NULL COMMENT 'User who created the challenge',
    opponent_id INT NULL COMMENT 'User who joined the challenge',
    subject VARCHAR(50) NULL COMMENT 'Subject filter for questions',
    difficulty VARCHAR(20) DEFAULT 'medium' COMMENT 'Difficulty level',
    question_count INT DEFAULT 10 COMMENT 'Number of questions in the challenge',
    time_per_question INT DEFAULT 10 COMMENT 'Seconds per question',
    status ENUM('waiting', 'in_progress', 'completed', 'abandoned') DEFAULT 'waiting',
    winner_id INT NULL COMMENT 'Winner of the challenge',
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
);

-- Challenge Participants Table
-- Tracks individual player scores and progress
CREATE TABLE challenge_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_answered INT DEFAULT 0,
    current_question_index INT DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    is_ready BOOLEAN DEFAULT FALSE COMMENT 'Player ready status',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES challenge_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_user (room_id, user_id),
    INDEX idx_room_participants (room_id),
    INDEX idx_user_challenges (user_id)
);

-- Challenge Questions Table
-- Stores questions assigned to a specific challenge
CREATE TABLE challenge_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    question_id INT NOT NULL,
    question_order INT NOT NULL COMMENT 'Order of question in the challenge',
    FOREIGN KEY (room_id) REFERENCES challenge_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_question_order (room_id, question_order),
    INDEX idx_room_questions (room_id)
);

-- Challenge Attempts Table
-- Stores individual answers within challenges
CREATE TABLE challenge_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_given VARCHAR(500) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded INT DEFAULT 0,
    time_taken INT NULL COMMENT 'Time in seconds to answer',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES challenge_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_room_user_attempts (room_id, user_id),
    INDEX idx_room_question (room_id, question_id),
    INDEX idx_user_attempts (user_id)
);

-- Challenge Leaderboard View
-- Provides real-time challenge rankings
CREATE VIEW challenge_leaderboard AS
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
WHERE cr.status IN ('in_progress', 'completed');

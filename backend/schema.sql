-- MindArena MVP Database Schema
-- This file contains all tables, relationships, and initial data for the MindArena learning platform

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS mindarena;
USE mindarena;

-- Drop tables if they exist (for clean re-creation)
-- Drop in reverse order of foreign key dependencies
DROP TABLE IF EXISTS contest_registrations;
DROP TABLE IF EXISTS contest_attempts;
DROP TABLE IF EXISTS contest_participants;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS user_subjects;
DROP TABLE IF EXISTS attempts;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS grade_levels;

-- Grade Levels Table
-- Stores academic grade levels (Grade 1-12)
CREATE TABLE grade_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects Table
-- Stores academic subjects (Math, English, Science, etc.)
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
-- Stores student accounts with authentication and profile information
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    grade_level_id INT,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_grade_level (grade_level_id)
);

-- User-Subjects Junction Table
-- Many-to-many relationship between users and subjects
CREATE TABLE user_subjects (
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, subject_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Questions Table
-- Stores practice questions with answers, hints, and metadata
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade_level_id INT NOT NULL,
    subject_id INT NOT NULL,
    content TEXT NOT NULL,
    correct_answer VARCHAR(500) NOT NULL,
    hint TEXT,
    explanation TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_grade_subject (grade_level_id, subject_id),
    INDEX idx_difficulty (difficulty_level)
);

-- Attempts Table
-- Stores student answer attempts for tracking progress and statistics
CREATE TABLE attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_given VARCHAR(500) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id),
    INDEX idx_question_attempts (question_id),
    INDEX idx_user_correct (user_id, is_correct),
    INDEX idx_created_at (created_at)
);

-- Contests Table
-- Stores contest information with timing, difficulty, and prizes
CREATE TABLE contests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    duration INT NOT NULL COMMENT 'Duration in minutes',
    question_count INT NOT NULL DEFAULT 10,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('available', 'upcoming', 'ended') NOT NULL DEFAULT 'available',
    prize VARCHAR(100) NOT NULL,
    max_participants INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    INDEX idx_difficulty (difficulty)
);

-- Contest Registrations Table
-- Stores user registrations for upcoming contests
CREATE TABLE contest_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contest_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_contest_user_registration (contest_id, user_id),
    INDEX idx_user_registrations (user_id),
    INDEX idx_registered_at (registered_at)
);

-- Contest Participants Table
-- Tracks user participation in contests
CREATE TABLE contest_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contest_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When user started the contest',
    end_time TIMESTAMP NULL COMMENT 'When user finished the contest',
    score INT DEFAULT 0 COMMENT 'Total score achieved',
    rank INT NULL COMMENT 'Final rank in the contest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_contest_user (contest_id, user_id),
    INDEX idx_contest_participants (contest_id, user_id),
    INDEX idx_contest_score (contest_id, score DESC)
);

-- Contest Attempts Table
-- Stores individual question answers within contests
CREATE TABLE contest_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contest_id INT NOT NULL,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_given VARCHAR(500) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    points_awarded INT NOT NULL DEFAULT 0,
    time_taken INT NULL COMMENT 'Time in seconds to answer this question',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_contest_user_attempts (contest_id, user_id),
    INDEX idx_contest_question (contest_id, question_id),
    INDEX idx_user_correct (user_id, is_correct),
    INDEX idx_created_at (created_at)
);

-- Insert Grade Levels (Grades 1-12)
INSERT INTO grade_levels (id, name) VALUES
(1, 'Grade 1'),
(2, 'Grade 2'),
(3, 'Grade 3'),
(4, 'Grade 4'),
(5, 'Grade 5'),
(6, 'Grade 6'),
(7, 'Grade 7'),
(8, 'Grade 8'),
(9, 'Grade 9'),
(10, 'Grade 10'),
(11, 'Grade 11'),
(12, 'Grade 12');

-- Insert Subjects
INSERT INTO subjects (id, name) VALUES
(1, 'Math'),
(2, 'English'),
(3, 'Science'),
(4, 'History'),
(5, 'Geography'),
(6, 'Chemistry'),
(7, 'Biology'),
(8, 'Physics'),
(9, 'Computer Science'),
(10, 'Art'),
(11, 'Music'),
(12, 'Physical Education');

-- Insert Sample Questions
-- Math Questions - Grade 5
INSERT INTO questions (id, grade_level_id, subject_id, content, correct_answer, hint, difficulty_level) VALUES
(1, 5, 1, 'What is 15 + 27?', '42', 'Add the tens and ones separately.', 'easy'),
(2, 5, 1, 'What is 8 × 7?', '56', 'Think of it as 8 groups of 7.', 'easy'),
(3, 5, 1, 'What is 144 ÷ 12?', '12', 'Think of what number multiplied by 12 equals 144.', 'medium'),
(4, 5, 1, 'Solve for x: 3x = 12', '4', 'Divide both sides by 3.', 'medium'),
(5, 5, 1, 'What is the perimeter of a rectangle with length 8 and width 5?', '26', 'Add all four sides: 8 + 8 + 5 + 5.', 'medium');

-- English Questions - Grade 5
INSERT INTO questions (id, grade_level_id, subject_id, content, correct_answer, hint, difficulty_level) VALUES
(6, 5, 2, 'What is the past tense of "go"?', 'went', 'This is an irregular verb.', 'easy'),
(7, 5, 2, 'Which is a noun: run, running, or runner?', 'runner', 'A noun names a person, place, or thing.', 'easy'),
(8, 5, 2, 'Complete the sentence: The dog ___ over the fence.', 'jumped', 'Use past tense for a completed action.', 'easy'),
(9, 5, 2, 'What is the plural of "child"?', 'children', 'This is an irregular plural.', 'medium'),
(10, 5, 2, 'Which word is an adjective in "The big red ball"?', 'big, red', 'Adjectives describe nouns.', 'medium');

-- Math Questions - Grade 10
INSERT INTO questions (id, grade_level_id, subject_id, content, correct_answer, hint, difficulty_level) VALUES
(11, 10, 1, 'Solve: 2x² + 5x - 3 = 0', 'x = 0.5, x = -3', 'Use the quadratic formula.', 'hard'),
(12, 10, 1, 'What is the derivative of x³ + 2x?', '3x² + 2', 'Apply the power rule.', 'hard'),
(13, 10, 1, 'Find sin(30°)', '0.5', 'Remember the unit circle values.', 'medium'),
(14, 10, 1, 'What is log₂(8)?', '3', '2 to what power equals 8?', 'medium'),
(15, 10, 1, 'Solve: |2x - 1| = 5', 'x = 3, x = -2', 'Consider both positive and negative cases.', 'hard');

-- English Questions - Grade 10
INSERT INTO questions (id, grade_level_id, subject_id, content, correct_answer, hint, difficulty_level) VALUES
(16, 10, 2, 'Identify the literary device: "The wind whispered through the trees"', 'personification', 'Giving human qualities to non-human things.', 'medium'),
(17, 10, 2, 'What is a thesis statement?', 'Main argument of an essay', 'It appears in the introduction.', 'medium'),
(18, 10, 2, 'Correct the sentence: Him and me went to the store.', 'He and I went to the store', 'Use subject pronouns.', 'easy'),
(19, 10, 2, 'What is a metaphor?', 'Comparison without using "like" or "as"', 'Direct comparison between two unlike things.', 'medium'),
(20, 10, 2, 'Identify the clause type in "When the rain stops, we will play"', 'subordinate clause', 'It cannot stand alone as a sentence.', 'hard');

-- Insert Sample Contests
INSERT INTO contests (id, title, description, subject, difficulty, duration, question_count, start_date, end_date, status, prize, max_participants) VALUES
(1, 'Weekly Math Challenge', 'Test your math skills in this timed challenge!', 'Mathematics', 'medium', 10, 10, '2026-04-01', '2026-04-07', 'available', '50 points', 100),
(2, 'Science Olympiad', 'Comprehensive science quiz covering physics, chemistry, and biology.', 'Science', 'hard', 15, 15, '2026-04-10', '2026-04-20', 'upcoming', '100 points', 50),
(3, 'Quick Quiz - Easy', 'A quick warm-up quiz for beginners.', 'General', 'easy', 5, 5, '2026-03-01', '2026-03-31', 'ended', '20 points', 200),
(4, 'Coding Challenge', 'Test your programming skills with coding problems.', 'Computer Science', 'hard', 20, 8, '2026-04-15', '2026-04-25', 'upcoming', '150 points', 30),
(5, 'History Bee', 'Test your knowledge of world history!', 'History', 'medium', 12, 12, '2026-03-15', '2026-03-25', 'ended', '75 points', 75);

-- Create Views for Common Queries

-- User Statistics View
-- Provides pre-calculated statistics for each user
CREATE VIEW user_statistics AS
SELECT 
    u.id,
    u.email,
    u.display_name,
    u.grade_level_id,
    u.points,
    gl.name as grade_level_name,
    COUNT(a.id) as total_attempts,
    SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
    ROUND(
        CASE 
            WHEN COUNT(a.id) > 0 
            THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 
            ELSE 0 
        END, 2
    ) as accuracy_percentage,
    u.created_at
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
GROUP BY u.id, u.email, u.display_name, u.grade_level_id, u.points, gl.name, u.created_at;

-- Leaderboard View
-- Pre-calculated leaderboard for each grade level
CREATE VIEW grade_leaderboards AS
SELECT 
    u.grade_level_id,
    gl.name as grade_level_name,
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
        END, 2
    ) as accuracy_percentage
FROM users u
LEFT JOIN attempts a ON u.id = a.user_id
LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
WHERE u.grade_level_id IS NOT NULL
GROUP BY u.grade_level_id, gl.name, u.id, u.display_name, u.points;

-- Question Statistics View
-- Provides statistics for each question
CREATE VIEW question_statistics AS
SELECT 
    q.id,
    q.content,
    q.grade_level_id,
    q.subject_id,
    gl.name as grade_level_name,
    s.name as subject_name,
    q.difficulty_level,
    COUNT(a.id) as total_attempts,
    SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
    ROUND(
        CASE 
            WHEN COUNT(a.id) > 0 
            THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 
            ELSE 0 
        END, 2
    ) as success_rate,
    q.created_at
FROM questions q
LEFT JOIN attempts a ON q.id = a.question_id
LEFT JOIN grade_levels gl ON q.grade_level_id = gl.id
LEFT JOIN subjects s ON q.subject_id = s.id
GROUP BY q.id, q.content, q.grade_level_id, q.subject_id, gl.name, s.name, q.difficulty_level, q.created_at;

-- Contest Views

-- Contest Leaderboard View
-- Provides rankings for each contest
CREATE VIEW contest_leaderboards AS
SELECT 
    cp.contest_id,
    c.title as contest_title,
    c.subject as contest_subject,
    c.difficulty as contest_difficulty,
    u.id as user_id,
    u.display_name,
    cp.score,
    cp.rank,
    cp.start_time,
    cp.end_time,
    TIMESTAMPDIFF(SECOND, cp.start_time, COALESCE(cp.end_time, NOW())) as duration_seconds,
    CASE 
        WHEN cp.end_time IS NOT NULL THEN 'completed'
        WHEN cp.start_time IS NOT NULL THEN 'in_progress'
        ELSE 'registered'
    END as participation_status
FROM contests c
INNER JOIN contest_participants cp ON c.id = cp.contest_id
INNER JOIN users u ON cp.user_id = u.id
ORDER BY cp.contest_id, cp.rank ASC, cp.start_time ASC;

-- Contest Statistics View
-- Provides statistics for each contest
CREATE VIEW contest_statistics AS
SELECT 
    c.id as contest_id,
    c.title,
    c.subject,
    c.difficulty,
    c.status,
    c.start_date,
    c.end_date,
    c.prize,
    c.max_participants,
    COUNT(cp.id) as total_participants,
    COUNT(CASE WHEN cp.end_time IS NOT NULL THEN 1 END) as completed_participants,
    AVG(CASE WHEN cp.end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, cp.start_time, cp.end_time) END) as avg_completion_time_seconds,
    MAX(cp.score) as highest_score,
    AVG(cp.score) as avg_score
FROM contests c
LEFT JOIN contest_participants cp ON c.id = cp.contest_id
GROUP BY c.id, c.title, c.subject, c.difficulty, c.status, c.start_date, c.end_date, c.prize, c.max_participants;

-- Contest Registration Views

-- Contest Registration Statistics View
-- Provides registration statistics for each contest
CREATE VIEW contest_registration_statistics AS
SELECT 
    c.id as contest_id,
    c.title,
    c.subject,
    c.difficulty,
    c.status,
    c.start_date,
    c.end_date,
    c.max_participants,
    COUNT(cr.id) as total_registrations,
    COUNT(CASE WHEN cr.notification_sent = TRUE THEN 1 END) as notified_count,
    cr.registered_at as latest_registration,
    ROUND(COUNT(cr.id) / c.max_participants * 100, 2) as registration_percentage
FROM contests c
LEFT JOIN contest_registrations cr ON c.id = cr.contest_id
GROUP BY c.id, c.title, c.subject, c.difficulty, c.status, c.start_date, c.end_date, c.max_participants, cr.registered_at;

-- User Contest Registrations View
-- Provides user's contest registration history
CREATE VIEW user_contest_registrations AS
SELECT 
    u.id as user_id,
    u.display_name,
    u.email,
    cr.contest_id,
    c.title as contest_title,
    c.subject as contest_subject,
    c.difficulty as contest_difficulty,
    c.start_date as contest_start_date,
    c.end_date as contest_end_date,
    c.prize as contest_prize,
    cr.registered_at,
    cr.notification_sent,
    CASE 
        WHEN c.status = 'upcoming' THEN 'registered'
        WHEN c.status = 'available' AND cr.notification_sent = TRUE THEN 'notified'
        WHEN c.status = 'ended' THEN 'completed'
        ELSE 'unknown'
    END as registration_status
FROM users u
INNER JOIN contest_registrations cr ON u.id = cr.user_id
INNER JOIN contests c ON cr.contest_id = c.id
ORDER BY cr.registered_at DESC;

-- Create Stored Procedures for Common Operations

-- Procedure to get user dashboard statistics
DELIMITER //
CREATE PROCEDURE GetUserDashboardStats(IN user_id INT)
BEGIN
    SELECT 
        u.points,
        COALESCE(stats.total_attempts, 0) as total_attempted,
        COALESCE(stats.correct_answers, 0) as correct_answers,
        ROUND(
            CASE 
                WHEN stats.total_attempts > 0 
                THEN (stats.correct_answers / stats.total_attempts) * 100 
                ELSE 0 
            END, 1
        ) as accuracy
    FROM users u
    LEFT JOIN (
        SELECT 
            a.user_id,
            COUNT(a.id) as total_attempts,
            SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers
        FROM attempts a
        WHERE a.user_id = user_id
        GROUP BY a.user_id
    ) stats ON u.id = stats.user_id
    WHERE u.id = user_id;
END //
DELIMITER ;

-- Procedure to get leaderboard for a specific grade
DELIMITER //
CREATE PROCEDURE GetGradeLeaderboard(IN grade_level_id_param INT)
BEGIN
    SELECT 
        u.id as user_id,
        u.display_name,
        u.points,
        COALESCE(stats.total_attempts, 0) as total_attempted,
        COALESCE(stats.correct_answers, 0) as correct_answers,
        ROUND(
            CASE 
                WHEN stats.total_attempts > 0 
                THEN (stats.correct_answers / stats.total_attempts) * 100 
                ELSE 0 
            END, 1
        ) as accuracy
    FROM users u
    LEFT JOIN (
        SELECT 
            a.user_id,
            COUNT(a.id) as total_attempts,
            SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers
        FROM attempts a
        INNER JOIN users u2 ON a.user_id = u2.id
        WHERE u2.grade_level_id = grade_level_id_param
        GROUP BY a.user_id
    ) stats ON u.id = stats.user_id
    WHERE u.grade_level_id = grade_level_id_param
    ORDER BY u.points DESC, 
        CASE 
            WHEN stats.total_attempts > 0 
            THEN (stats.correct_answers / stats.total_attempts) 
            ELSE 0 
        END DESC
    LIMIT 50;
END //
DELIMITER ;

-- Contest Registration Procedures

-- Procedure to register user for a contest
DELIMITER //
CREATE PROCEDURE RegisterForContest(
    IN p_contest_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_contest_status VARCHAR(20);
    DECLARE v_already_registered INT;
    
    -- Check if contest exists and is upcoming
    SELECT status INTO v_contest_status
    FROM contests 
    WHERE id = p_contest_id;
    
    IF v_contest_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Contest not found';
    END IF;
    
    IF v_contest_status != 'upcoming' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Can only register for upcoming contests';
    END IF;
    
    -- Check if user already registered
    SELECT COUNT(*) INTO v_already_registered 
    FROM contest_registrations 
    WHERE contest_id = p_contest_id AND user_id = p_user_id;
    
    IF v_already_registered > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already registered for this contest';
    END IF;
    
    -- Create registration record
    INSERT INTO contest_registrations (contest_id, user_id)
    VALUES (p_contest_id, p_user_id);
    
    SELECT 'Successfully registered for contest' as message;
END //
DELIMITER ;

-- Procedure to unregister user from a contest
DELIMITER //
CREATE PROCEDURE UnregisterFromContest(
    IN p_contest_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_registration_count INT;
    
    -- Check if registration exists
    SELECT COUNT(*) INTO v_registration_count
    FROM contest_registrations 
    WHERE contest_id = p_contest_id AND user_id = p_user_id;
    
    IF v_registration_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No registration found for this contest';
    END IF;
    
    -- Remove registration record
    DELETE FROM contest_registrations 
    WHERE contest_id = p_contest_id AND user_id = p_user_id;
    
    SELECT 'Successfully unregistered from contest' as message;
END //
DELIMITER ;

-- Procedure to get user's contest registrations
DELIMITER //
CREATE PROCEDURE GetUserContestRegistrations(
    IN p_user_id INT
)
BEGIN
    SELECT 
        cr.contest_id,
        c.title,
        c.description,
        c.subject,
        c.difficulty,
        c.start_date,
        c.end_date,
        c.prize,
        cr.registered_at,
        cr.notification_sent
    FROM contest_registrations cr
    INNER JOIN contests c ON cr.contest_id = c.id
    WHERE cr.user_id = p_user_id
    ORDER BY cr.registered_at DESC;
END //
DELIMITER ;

-- Procedure to notify registered users when contest starts
DELIMITER //
CREATE PROCEDURE NotifyRegisteredUsers(
    IN p_contest_id INT
)
BEGIN
    -- Update notification_sent flag for all registered users
    UPDATE contest_registrations 
    SET notification_sent = TRUE 
    WHERE contest_id = p_contest_id AND notification_sent = FALSE;
    
    SELECT CONCAT('Notified ', ROW_COUNT(), ' registered users') as message;
END //
DELIMITER ;

-- Contest Procedures

-- Procedure to start a contest for a user
DELIMITER //
CREATE PROCEDURE StartContest(
    IN p_contest_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_participants INT;
    
    -- Check if contest exists and is available
    SELECT COUNT(*) INTO v_participants 
    FROM contests 
    WHERE id = p_contest_id AND status = 'available' 
    AND start_date <= CURDATE() AND end_date >= CURDATE();
    
    IF v_participants = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Contest not available or not found';
    END IF;
    
    -- Check if user already participated
    SELECT COUNT(*) INTO v_participants 
    FROM contest_participants 
    WHERE contest_id = p_contest_id AND user_id = p_user_id;
    
    IF v_participants > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already participated in this contest';
    END IF;
    
    -- Create contest participation record
    INSERT INTO contest_participants (contest_id, user_id, start_time)
    VALUES (p_contest_id, p_user_id, NOW());
    
    SELECT 'Contest started successfully' as message;
END //
DELIMITER ;

-- Procedure to submit contest answer and update score
DELIMITER //
CREATE PROCEDURE SubmitContestAnswer(
    IN p_contest_id INT,
    IN p_user_id INT,
    IN p_question_id INT,
    IN p_answer VARCHAR(500),
    IN p_points INT
)
BEGIN
    DECLARE v_is_correct BOOLEAN DEFAULT FALSE;
    DECLARE v_correct_answer VARCHAR(500);
    DECLARE v_participant_id INT;
    
    -- Set default points if not provided
    IF p_points IS NULL THEN
        SET p_points = 10;
    END IF;
    
    -- Get correct answer for the question
    SELECT correct_answer INTO v_correct_answer
    FROM questions 
    WHERE id = p_question_id;
    
    -- Check if answer is correct
    SET v_is_correct = (v_correct_answer = p_answer);
    
    -- Get participant record
    SELECT id INTO v_participant_id
    FROM contest_participants 
    WHERE contest_id = p_contest_id AND user_id = p_user_id;
    
    -- Record the attempt
    INSERT INTO contest_attempts (
        contest_id, user_id, question_id, answer_given, 
        is_correct, points_awarded
    ) VALUES (
        p_contest_id, p_user_id, p_question_id, p_answer,
        v_is_correct, CASE WHEN v_is_correct THEN p_points ELSE 0 END
    );
    
    -- Update participant score if correct
    IF v_is_correct THEN
        UPDATE contest_participants 
        SET score = score + p_points 
        WHERE id = v_participant_id;
    END IF;
    
    SELECT 
        v_is_correct as is_correct,
        CASE WHEN v_is_correct THEN p_points ELSE 0 END as points_awarded,
        v_correct_answer as correct_answer;
END //
DELIMITER ;

-- Procedure to finish a contest and calculate rankings
DELIMITER //
CREATE PROCEDURE FinishContest(
    IN p_contest_id INT
)
BEGIN
    DECLARE v_rank INT DEFAULT 1;
    DECLARE v_current_score INT;
    DECLARE v_prev_score INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_cursor CURSOR FOR 
        SELECT score 
        FROM contest_participants 
        WHERE contest_id = p_contest_id AND end_time IS NOT NULL
        ORDER BY score DESC, start_time ASC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO v_current_score;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        IF v_current_score <> v_prev_score THEN
            SET v_rank = v_rank;
        END IF;
        
        UPDATE contest_participants 
        SET rank = v_rank 
        WHERE contest_id = p_contest_id AND score = v_current_score AND end_time IS NOT NULL;
        
        SET v_prev_score = v_current_score;
        SET v_rank = v_rank + 1;
    END LOOP;
    
    CLOSE user_cursor;
    
    SELECT 'Contest rankings calculated successfully' as message;
END //
DELIMITER ;

-- Procedure to get contest leaderboard
DELIMITER //
CREATE PROCEDURE GetContestLeaderboard(
    IN p_contest_id INT
)
BEGIN
    SELECT 
        u.id as user_id,
        u.display_name,
        cp.score,
        cp.rank,
        cp.start_time,
        cp.end_time,
        TIMESTAMPDIFF(SECOND, cp.start_time, COALESCE(cp.end_time, NOW())) as duration_seconds,
        CASE 
            WHEN cp.end_time IS NOT NULL THEN 'completed'
            WHEN cp.start_time IS NOT NULL THEN 'in_progress'
            ELSE 'registered'
        END as participation_status
    FROM contest_participants cp
    INNER JOIN users u ON cp.user_id = u.id
    WHERE cp.contest_id = p_contest_id
    ORDER BY cp.rank ASC, cp.start_time ASC;
END //
DELIMITER ;

-- Create Triggers for Data Integrity

-- Trigger to update user points when a correct answer is submitted
DELIMITER //
CREATE TRIGGER award_points_on_correct_answer
AFTER INSERT ON attempts
FOR EACH ROW
BEGIN
    IF NEW.is_correct = TRUE THEN
        UPDATE users 
        SET points = points + 1 
        WHERE id = NEW.user_id;
    END IF;
END //
DELIMITER ;

-- Contest Registration Triggers

-- Trigger to automatically notify users when contest becomes available
DELIMITER //
CREATE TRIGGER notify_on_contest_start
AFTER UPDATE ON contests
FOR EACH ROW
BEGIN
    IF NEW.status = 'available' AND OLD.status = 'upcoming' THEN
        -- Notify all registered users
        CALL NotifyRegisteredUsers(NEW.id);
    END IF;
END //
DELIMITER ;

-- Contest Triggers

-- Trigger to automatically finish contest when time expires
DELIMITER //
CREATE TRIGGER finish_expired_contests
AFTER UPDATE ON contests
FOR EACH ROW
BEGIN
    IF NEW.status = 'ended' AND OLD.status != 'ended' THEN
        -- Call procedure to calculate final rankings
        CALL FinishContest(NEW.id);
    END IF;
END //
DELIMITER ;

-- Trigger to update contest participant end time
DELIMITER //
CREATE TRIGGER set_contest_end_time
AFTER UPDATE ON contest_participants
FOR EACH ROW
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        -- Participant just finished the contest
        -- Additional logic can be added here for analytics
        INSERT INTO contest_attempts (contest_id, user_id, question_id, answer_given, is_correct, points_awarded)
        SELECT NEW.contest_id, NEW.user_id, q.id, 'CONTEST_COMPLETED', TRUE, 5
        FROM questions q 
        WHERE q.id = 1 LIMIT 1; -- Award completion bonus
    END IF;
END //
DELIMITER ;

-- Create Indexes for Performance Optimization
CREATE INDEX idx_users_grade_points ON users(grade_level_id, points DESC);
CREATE INDEX idx_attempts_user_created ON attempts(user_id, created_at DESC);
CREATE INDEX idx_questions_grade_subject_difficulty ON questions(grade_level_id, subject_id, difficulty_level);
CREATE INDEX idx_user_subjects_user ON user_subjects(user_id);
CREATE INDEX idx_user_subjects_subject ON user_subjects(subject_id);

-- Contest Indexes for Performance Optimization
CREATE INDEX idx_contests_status_dates ON contests(status, start_date, end_date);
CREATE INDEX idx_contests_subject_difficulty ON contests(subject, difficulty);
CREATE INDEX idx_contest_participants_contest_user ON contest_participants(contest_id, user_id);
CREATE INDEX idx_contest_participants_score ON contest_participants(contest_id, score DESC);
CREATE INDEX idx_contest_attempts_contest_user ON contest_attempts(contest_id, user_id);
CREATE INDEX idx_contest_attempts_question ON contest_attempts(contest_id, question_id);

-- Contest Registration Indexes for Performance Optimization
CREATE INDEX idx_contest_registrations_contest_user ON contest_registrations(contest_id, user_id);
CREATE INDEX idx_contest_registrations_user ON contest_registrations(user_id);
CREATE INDEX idx_contest_registrations_registered_at ON contest_registrations(registered_at);
CREATE INDEX idx_contest_registrations_notification ON contest_registrations(notification_sent);

-- Final Setup Confirmation
SELECT 'MindArena MVP Database Schema created successfully!' as status;
SELECT COUNT(*) as grade_levels_count FROM grade_levels;
SELECT COUNT(*) as subjects_count FROM subjects;
SELECT COUNT(*) as questions_count FROM questions;
SELECT COUNT(*) as contests_count FROM contests;
SELECT COUNT(*) as contest_registrations_count FROM contest_registrations;

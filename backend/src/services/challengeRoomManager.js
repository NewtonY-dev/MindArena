import db from '../config/db.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';

class ChallengeRoomManager {
  constructor() {
    // In-memory cache for active rooms (for performance)
    this.activeRooms = new Map();
  }

  // Create a new challenge room
  async createRoom({ hostId, subject, difficulty = 'medium', questionCount = 10, timePerQuestion = 10 }) {
    const roomCode = generateRoomCode();
    
    // Clear any stale cache entry for this room code (shouldn't exist but be safe)
    this.activeRooms.delete(roomCode);
    
    const sql = `
      INSERT INTO challenge_rooms 
        (room_code, host_id, subject, difficulty, question_count, time_per_question, status)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting')
    `;
    
    try {
      const result = await db.queryAsync(sql, [
        roomCode, hostId, subject, difficulty, questionCount, timePerQuestion
      ]);

      // Add host as participant
      const participantSql = `
        INSERT INTO challenge_participants (room_id, user_id, is_ready)
        VALUES (?, ?, TRUE)
      `;
      await db.queryAsync(participantSql, [result.insertId, hostId]);

      const room = {
        id: result.insertId,
        roomCode,
        hostId,
        subject,
        difficulty,
        questionCount,
        timePerQuestion,
        status: 'waiting',
        opponentId: null,
        hostReady: true,
        opponentReady: false
      };

      // Cache the room
      this.activeRooms.set(roomCode, room);
      console.log(`[CREATE] Room ${roomCode} cached with opponentId:`, room.opponentId);

      return {
        roomId: result.insertId,
        roomCode,
        status: 'waiting',
        message: 'Room created successfully. Share this code with your friend!'
      };
    } catch (error) {
      console.error('Create room error:', error);
      throw new Error('Failed to create challenge room');
    }
  }

  // Join an existing room
  async joinRoom({ roomCode, opponentId }) {
    // Check cache first
    let room = this.activeRooms.get(roomCode);
    console.log(`[JOIN] Cache lookup for ${roomCode}:`, room ? `found (opponentId: ${room.opponentId})` : 'not found');
    
    if (!room) {
      // Fetch from database
      const sql = `
        SELECT cr.*, 
          cp1.is_ready as host_ready,
          cp2.is_ready as opponent_ready
        FROM challenge_rooms cr
        LEFT JOIN challenge_participants cp1 ON cr.id = cp1.room_id AND cp1.user_id = cr.host_id
        LEFT JOIN challenge_participants cp2 ON cr.id = cp2.room_id AND cp2.user_id = cr.opponent_id
        WHERE cr.room_code = ? AND cr.status = 'waiting' AND cr.opponent_id IS NULL
      `;
      const results = await db.queryAsync(sql, [roomCode]);
      
      if (results.length === 0) {
        throw new Error('Room not found or game already started');
      }
      
      // Normalize DB row to camelCase for consistent property access
      const dbRoom = results[0];
      room = {
        id: dbRoom.id,
        roomCode: dbRoom.room_code,
        hostId: dbRoom.host_id,
        opponentId: dbRoom.opponent_id || null, // Convert DB NULL to JS null
        subject: dbRoom.subject,
        difficulty: dbRoom.difficulty,
        questionCount: dbRoom.question_count,
        timePerQuestion: dbRoom.time_per_question,
        status: dbRoom.status,
        hostReady: dbRoom.host_ready,
        opponentReady: dbRoom.opponent_ready
      };
    }

    console.log(`[JOIN] Checking room ${roomCode} - opponentId:`, room.opponentId, 'type:', typeof room.opponentId);
    
    if (room.opponentId) {
      throw new Error('Room is already full');
    }

    if (room.hostId === opponentId) {
      throw new Error('You cannot join your own room');
    }

    // Update room with opponent
    const updateSql = `
      UPDATE challenge_rooms 
      SET opponent_id = ?, status = 'in_progress', started_at = NOW()
      WHERE id = ?
    `;
    await db.queryAsync(updateSql, [opponentId, room.id]);

    // Add opponent as participant
    const participantSql = `
      INSERT INTO challenge_participants (room_id, user_id, is_ready)
      VALUES (?, ?, TRUE)
    `;
    await db.queryAsync(participantSql, [room.id, opponentId]);

    // Update cache
    room.opponentId = opponentId;
    room.status = 'ready_to_start';
    this.activeRooms.set(roomCode, room);

    // Get host info
    const hostSql = `SELECT display_name FROM users WHERE id = ?`;
    const hostResult = await db.queryAsync(hostSql, [room.hostId]);

    return {
      roomId: room.id,
      roomCode,
      status: 'ready_to_start',
      hostId: room.hostId,
      hostName: hostResult[0]?.display_name || 'Player 1',
      message: 'Successfully joined the challenge!'
    };
  }

  // Set player ready status
  async setPlayerReady({ roomCode, userId, isReady }) {
    const sql = `
      UPDATE challenge_participants 
      SET is_ready = ?
      WHERE room_id = (SELECT id FROM challenge_rooms WHERE room_code = ?)
      AND user_id = ?
    `;
    await db.queryAsync(sql, [isReady, roomCode, userId]);

    // Check if both players are ready
    const checkSql = `
      SELECT 
        cr.id,
        SUM(CASE WHEN cp.user_id = cr.host_id AND cp.is_ready = TRUE THEN 1 ELSE 0 END) as host_ready,
        SUM(CASE WHEN cp.user_id = cr.opponent_id AND cp.is_ready = TRUE THEN 1 ELSE 0 END) as opponent_ready
      FROM challenge_rooms cr
      LEFT JOIN challenge_participants cp ON cr.id = cp.room_id
      WHERE cr.room_code = ?
      GROUP BY cr.id
    `;
    const result = await db.queryAsync(checkSql, [roomCode]);
    
    return {
      bothReady: result[0]?.host_ready > 0 && result[0]?.opponent_ready > 0
    };
  }

  // Start the game - fetch and assign questions
  async startGame(roomCode) {
    const room = this.activeRooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    // Fetch random questions
    const questionsSql = `
      SELECT q.id, q.content, q.correct_answer, q.hint, q.difficulty_level,
             s.name as subject_name
      FROM questions q
      INNER JOIN subjects s ON q.subject_id = s.id
      WHERE q.grade_level_id = (SELECT grade_level_id FROM users WHERE id = ?)
      ${room.subject ? "AND s.name = ?" : ''}
      ${room.difficulty ? "AND q.difficulty_level = ?" : ''}
      ORDER BY RAND()
      LIMIT ?
    `;
    
    const params = [room.hostId];
    if (room.subject) params.push(room.subject);
    if (room.difficulty) params.push(room.difficulty);
    params.push(room.questionCount);

    const questions = await db.queryAsync(questionsSql, params);

    if (questions.length === 0) {
      throw new Error('No questions available for this challenge');
    }

    // Store questions for the room
    const questionValues = questions.map((q, index) => [
      room.id, q.id, index + 1
    ]);
    
    // Build placeholder string: (?, ?, ?), (?, ?, ?), ...
    const placeholders = questionValues.map(() => '(?, ?, ?)').join(', ');
    const insertQuestionsSql = `
      INSERT INTO challenge_questions (room_id, question_id, question_order)
      VALUES ${placeholders}
    `;
    
    // Flatten the values array for the query
    const flatValues = questionValues.flat();
    await db.queryAsync(insertQuestionsSql, flatValues);

    // Update room status
    await db.queryAsync(
      "UPDATE challenge_rooms SET status = 'in_progress' WHERE room_code = ?",
      [roomCode]
    );

    room.status = 'in_progress';
    room.questions = questions;
    this.activeRooms.set(roomCode, room);

    return {
      totalQuestions: questions.length,
      timePerQuestion: room.timePerQuestion,
      firstQuestion: {
        id: questions[0].id,
        content: questions[0].content,
        hint: questions[0].hint,
        subject: questions[0].subject_name,
        difficulty: questions[0].difficulty_level
      }
    };
  }

  // Submit an answer
  async submitAnswer({ roomCode, userId, questionId, answer, timeTaken }) {
    const room = this.activeRooms.get(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    // Get correct answer
    const correctAnswerSql = `SELECT correct_answer FROM questions WHERE id = ?`;
    const correctResult = await db.queryAsync(correctAnswerSql, [questionId]);
    const correctAnswer = correctResult[0]?.correct_answer;
    
    const isCorrect = answer.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
    
    // Calculate points (10 base + up to 5 bonus for speed)
    const basePoints = 10;
    const speedBonus = Math.max(0, Math.floor((room.timePerQuestion - timeTaken) / 2));
    const pointsAwarded = isCorrect ? basePoints + speedBonus : 0;

    // Record the attempt
    const attemptSql = `
      INSERT INTO challenge_attempts 
        (room_id, user_id, question_id, answer_given, is_correct, points_awarded, time_taken)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.queryAsync(attemptSql, [
      room.id, userId, questionId, answer, isCorrect, pointsAwarded, timeTaken
    ]);

    // Update participant score
    const updateScoreSql = `
      UPDATE challenge_participants 
      SET score = score + ?,
          correct_answers = correct_answers + ?,
          total_answered = total_answered + 1,
          current_question_index = current_question_index + 1,
          time_spent_seconds = time_spent_seconds + ?
      WHERE room_id = ? AND user_id = ?
    `;
    await db.queryAsync(updateScoreSql, [
      pointsAwarded, isCorrect ? 1 : 0, timeTaken, room.id, userId
    ]);

    // Get current scores
    const scoresSql = `
      SELECT 
        cp.user_id,
        u.display_name,
        cp.score,
        cp.correct_answers,
        cp.total_answered,
        cp.current_question_index
      FROM challenge_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.room_id = ?
      ORDER BY cp.score DESC
    `;
    const scores = await db.queryAsync(scoresSql, [room.id]);

    // Find current user's progress (not just highest scorer)
    const currentUserScore = scores.find(s => s.user_id === userId);
    const nextQuestionIndex = currentUserScore?.current_question_index || 0;
    const gameComplete = nextQuestionIndex >= room.questions.length;

    let nextQuestion = null;
    let winner = null;

    if (!gameComplete) {
      const nextQ = room.questions[nextQuestionIndex];
      nextQuestion = {
        id: nextQ.id,
        content: nextQ.content,
        hint: nextQ.hint,
        subject: nextQ.subject_name,
        difficulty: nextQ.difficulty_level
      };
    } else {
      // Game complete - determine winner
      await this.endGame(roomCode, scores);
      
      if (scores[0].score > scores[1]?.score) {
        winner = { id: scores[0].user_id, name: scores[0].display_name };
      } else if (scores[1]?.score > scores[0].score) {
        winner = { id: scores[1].user_id, name: scores[1].display_name };
      }
    }

    return {
      scores: scores.map(s => ({
        userId: s.user_id,
        name: s.display_name,
        score: s.score,
        correctAnswers: s.correct_answers,
        totalAnswered: s.total_answered
      })),
      currentQuestion: nextQuestionIndex,
      totalQuestions: room.questions.length,
      nextQuestion,
      gameComplete,
      winner
    };
  }

  // Handle time up (no answer submitted)
  async handleTimeUp({ roomCode, userId, questionId }) {
    // Record as incorrect with 0 points
    return this.submitAnswer({
      roomCode,
      userId,
      questionId,
      answer: '',
      timeTaken: 0
    });
  }

  // End the game
  async endGame(roomCode, scores) {
    const room = this.activeRooms.get(roomCode);
    if (!room) return;

    let winnerId = null;
    if (scores[0].score > scores[1]?.score) {
      winnerId = scores[0].user_id;
    } else if (scores[1]?.score > scores[0].score) {
      winnerId = scores[1].user_id;
    }

    // Update room status
    await db.queryAsync(
      `UPDATE challenge_rooms 
       SET status = 'completed', 
           winner_id = ?, 
           ended_at = NOW()
       WHERE room_code = ?`,
      [winnerId, roomCode]
    );

    // Mark participants as finished
    const finishedSql = `
      UPDATE challenge_participants 
      SET finished_at = NOW()
      WHERE room_id = ? AND user_id IN (?, ?)
    `;
    await db.queryAsync(finishedSql, [room.id, room.hostId, room.opponentId]);

    // Update winner stats if there is a winner
    if (winnerId) {
      await db.queryAsync(
        'UPDATE users SET points = points + 50 WHERE id = ?',
        [winnerId]
      );
    }

    // Remove from active cache
    this.activeRooms.delete(roomCode);
  }

  // Leave room
  async leaveRoom({ roomCode, userId }) {
    const room = this.activeRooms.get(roomCode);
    if (!room) return;

    // If game hasn't started, allow leaving
    if (room.status === 'waiting') {
      if (room.hostId === userId) {
        // Host leaving - delete room
        await db.queryAsync('DELETE FROM challenge_rooms WHERE room_code = ?', [roomCode]);
        this.activeRooms.delete(roomCode);
      } else {
        // Opponent leaving before game starts
        await db.queryAsync(
          'UPDATE challenge_rooms SET opponent_id = NULL WHERE room_code = ?',
          [roomCode]
        );
        room.opponentId = null;
        this.activeRooms.set(roomCode, room);
      }
    }
  }

  // Handle disconnection
  async handleDisconnect({ roomCode, userId }) {
    const room = this.activeRooms.get(roomCode);
    if (!room) return;

    if (room.status === 'waiting') {
      await this.leaveRoom({ roomCode, userId });
    } else if (room.status === 'in_progress') {
      // If disconnect during game, opponent wins by forfeit
      const opponentId = room.hostId === userId ? room.opponentId : room.hostId;
      
      if (opponentId) {
        await this.endGame(roomCode, [
          { user_id: opponentId, score: 999 },
          { user_id: userId, score: 0 }
        ]);
      }
    }
  }

  // Get room info
  async getRoomInfo(roomCode) {
    const sql = `
      SELECT 
        cr.*,
        h.display_name as host_name,
        o.display_name as opponent_name,
        cp1.score as host_score,
        cp2.score as opponent_score
      FROM challenge_rooms cr
      INNER JOIN users h ON cr.host_id = h.id
      LEFT JOIN users o ON cr.opponent_id = o.id
      LEFT JOIN challenge_participants cp1 ON cr.id = cp1.room_id AND cp1.user_id = cr.host_id
      LEFT JOIN challenge_participants cp2 ON cr.id = cp2.room_id AND cp2.user_id = cr.opponent_id
      WHERE cr.room_code = ?
    `;
    const results = await db.queryAsync(sql, [roomCode]);
    return results[0] || null;
  }

  // Get active rooms for a user
  async getUserActiveRooms(userId) {
    const sql = `
      SELECT cr.*, 
        h.display_name as host_name,
        o.display_name as opponent_name
      FROM challenge_rooms cr
      INNER JOIN users h ON cr.host_id = h.id
      LEFT JOIN users o ON cr.opponent_id = o.id
      WHERE (cr.host_id = ? OR cr.opponent_id = ?)
      AND cr.status IN ('waiting', 'in_progress')
      ORDER BY cr.created_at DESC
    `;
    return await db.queryAsync(sql, [userId, userId]);
  }

  // Get challenge history
  async getUserChallengeHistory(userId, limit = 20) {
    const sql = `
      SELECT 
        cr.*,
        h.display_name as host_name,
        o.display_name as opponent_name,
        w.display_name as winner_name,
        cp.score as user_score,
        cp.correct_answers,
        cp.total_answered
      FROM challenge_rooms cr
      INNER JOIN users h ON cr.host_id = h.id
      LEFT JOIN users o ON cr.opponent_id = o.id
      LEFT JOIN users w ON cr.winner_id = w.id
      INNER JOIN challenge_participants cp ON cr.id = cp.room_id
      WHERE cp.user_id = ?
      AND cr.status = 'completed'
      ORDER BY cr.ended_at DESC
      LIMIT ?
    `;
    return await db.queryAsync(sql, [userId, limit]);
  }
}

// Export singleton instance
export default new ChallengeRoomManager();

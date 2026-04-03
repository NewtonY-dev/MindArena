import challengeRoomManager from '../services/challengeRoomManager.js';
import db from '../config/db.js';

// Create a challenge room (REST endpoint - returns room code)
export const createChallenge = async (req, res) => {
  try {
    const { subject, difficulty, questionCount, timePerQuestion } = req.body;
    const hostId = req.user.id;

    const result = await challengeRoomManager.createRoom({
      hostId,
      subject,
      difficulty,
      questionCount,
      timePerQuestion
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create challenge'
    });
  }
};

// Join a challenge room (REST endpoint)
export const joinChallenge = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const opponentId = req.user.id;

    const result = await challengeRoomManager.joinRoom({
      roomCode,
      opponentId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to join challenge'
    });
  }
};

// Get room info
export const getRoomInfo = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await challengeRoomManager.getRoomInfo(roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room info'
    });
  }
};

// Get user's active challenges
export const getActiveChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await challengeRoomManager.getUserActiveRooms(userId);

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get active challenges error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active challenges'
    });
  }
};

// Get user's challenge history
export const getChallengeHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    
    const history = await challengeRoomManager.getUserChallengeHistory(userId, parseInt(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get challenge history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get challenge history'
    });
  }
};

// Leave a challenge room
export const leaveChallenge = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;

    await challengeRoomManager.leaveRoom({ roomCode, userId });

    res.json({
      success: true,
      message: 'Left challenge successfully'
    });
  } catch (error) {
    console.error('Leave challenge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave challenge'
    });
  }
};

// Get challenge leaderboard
export const getChallengeLeaderboard = async (req, res) => {
  try {
    const sql = `
      SELECT 
        cr.id,
        cr.room_code,
        h.display_name as host_name,
        o.display_name as opponent_name,
        w.display_name as winner_name,
        cp1.score as host_score,
        cp2.score as opponent_score,
        cr.ended_at
      FROM challenge_rooms cr
      INNER JOIN users h ON cr.host_id = h.id
      LEFT JOIN users o ON cr.opponent_id = o.id
      LEFT JOIN users w ON cr.winner_id = w.id
      LEFT JOIN challenge_participants cp1 ON cr.id = cp1.room_id AND cp1.user_id = cr.host_id
      LEFT JOIN challenge_participants cp2 ON cr.id = cp2.room_id AND cp2.user_id = cr.opponent_id
      WHERE cr.status = 'completed'
      ORDER BY cr.ended_at DESC
      LIMIT 50
    `;
    
    const results = await db.queryAsync(sql);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get challenge leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
};

// Validate room code
export const validateRoomCode = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await challengeRoomManager.getRoomInfo(roomCode);

    if (!room) {
      return res.json({
        success: true,
        valid: false,
        message: 'Room not found'
      });
    }

    if (room.status !== 'waiting') {
      return res.json({
        success: true,
        valid: false,
        message: 'Game already in progress or completed'
      });
    }

    if (room.opponent_id) {
      return res.json({
        success: true,
        valid: false,
        message: 'Room is full'
      });
    }

    res.json({
      success: true,
      valid: true,
      room: {
        roomCode: room.room_code,
        hostName: room.host_name,
        subject: room.subject,
        difficulty: room.difficulty,
        questionCount: room.question_count
      }
    });
  } catch (error) {
    console.error('Validate room code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate room code'
    });
  }
};

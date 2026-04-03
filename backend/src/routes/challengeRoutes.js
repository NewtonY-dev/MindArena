import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createChallenge,
  joinChallenge,
  getRoomInfo,
  getActiveChallenges,
  getChallengeHistory,
  leaveChallenge,
  getChallengeLeaderboard,
  validateRoomCode
} from '../controllers/challengeController.js';

const router = express.Router();

// Create a new challenge room
router.post('/create', authMiddleware, createChallenge);

// Join an existing challenge room
router.post('/join', authMiddleware, joinChallenge);

// Validate room code (for pre-checking)
router.get('/validate/:roomCode', authMiddleware, validateRoomCode);

// Get room info
router.get('/room/:roomCode', authMiddleware, getRoomInfo);

// Get user's active challenges
router.get('/active', authMiddleware, getActiveChallenges);

// Get user's challenge history
router.get('/history', authMiddleware, getChallengeHistory);

// Leave a challenge room
router.post('/leave/:roomCode', authMiddleware, leaveChallenge);

// Get challenge leaderboard
router.get('/leaderboard', getChallengeLeaderboard);

export default router;

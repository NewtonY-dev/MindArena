import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getContests,
  getContestById,
  startContest,
  submitContestAnswer,
  getContestLeaderboard,
  registerForContest,
  unregisterFromContest,
  getUserContestRegistrations
} from '../controllers/contestController.js';

const router = express.Router();

// Get all contests with optional difficulty filter
router.get('/', getContests);

// Get specific contest by ID
router.get('/:id', getContestById);

// Start a contest (protected route)
router.post('/:id/start', authMiddleware, startContest);

// Submit answer for a contest (protected route)
router.post('/submit', authMiddleware, submitContestAnswer);

// Get contest leaderboard
router.get('/:id/leaderboard', getContestLeaderboard);

// Register for a contest (protected route)
router.post('/:id/register', authMiddleware, registerForContest);

// Unregister from a contest (protected route)
router.delete('/:id/register', authMiddleware, unregisterFromContest);

// Get user's contest registrations (protected route)
router.get('/registrations/my', authMiddleware, getUserContestRegistrations);

export default router;

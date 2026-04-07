import express from "express";
import {
  // User management
  getUsersByGrade,
  getTopUsers,
  searchUsersHandler,
  getUserStatsHandler,
  addUserPointsHandler,
  setUserPointsHandler,
  deleteUserHandler,
  // Contest management
  getAllContestsHandler,
  getContestByIdHandler,
  createContestHandler,
  updateContestHandler,
  updateContestStatusHandler,
  deleteContestHandler,
  refreshContestStatusesHandler,
  updateContestQuestionsHandler
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);

// ==================== USER MANAGEMENT ====================

// Get Users by Grade Level
router.get("/users/grade/:gradeLevelId", getUsersByGrade);

// Get Top Users by Points (Leaderboard)
router.get("/users/top", getTopUsers);

// Search Users
router.get("/users/search", searchUsersHandler);

// Get User Detailed Stats
router.get("/users/:userId/stats", getUserStatsHandler);

// Add User Points
router.post("/users/:userId/points/add", addUserPointsHandler);

// Set User Points (Exact value)
router.put("/users/:userId/points", setUserPointsHandler);

// Delete User
router.delete("/users/:userId", deleteUserHandler);

// ==================== CONTEST MANAGEMENT ====================

// Get All Contests
router.get("/contests", getAllContestsHandler);

// Get Contest by ID
router.get("/contests/:contestId", getContestByIdHandler);

// Create Contest
router.post("/contests", createContestHandler);

// Update Contest
router.put("/contests/:contestId", updateContestHandler);

// Update Contest Status
router.patch("/contests/:contestId/status", updateContestStatusHandler);

// Delete Contest
router.delete("/contests/:contestId", deleteContestHandler);

// Refresh Contest Statuses
router.post("/contests/refresh-status", refreshContestStatusesHandler);

// Update Contest Questions
router.put("/contests/:contestId/questions", updateContestQuestionsHandler);

export default router;

import express from "express";
import { 
  getUsersByGradeLevel, 
  getTopUsersByPoints, 
  searchUsers, 
  getUserStats,
  deleteUser,
  updateUserPoints,
  setUserPoints 
} from "../models/user.model.js";
import { getUserAttempts } from "../models/attempt.model.js";
import { getUserSubjects } from "../models/userSubject.model.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);

// Get Users by Grade Level
router.get("/users/grade/:gradeLevelId", async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const { limit = 50 } = req.query;
    
    const users = await getUsersByGradeLevel(gradeLevelId, parseInt(limit));
    res.json({ users });
  } catch (error) {
    console.error("Error getting users by grade level:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Top Users by Points (Leaderboard)
router.get("/users/top", async (req, res) => {
  try {
    const { limit = 10, gradeLevelId } = req.query;
    
    const users = await getTopUsersByPoints(parseInt(limit), gradeLevelId ? parseInt(gradeLevelId) : null);
    res.json({ users });
  } catch (error) {
    console.error("Error getting top users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search Users
router.get("/users/search", async (req, res) => {
  try {
    const { q: query, gradeLevelId, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const users = await searchUsers(
      query, 
      gradeLevelId ? parseInt(gradeLevelId) : null, 
      parseInt(limit)
    );
    res.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get User Detailed Stats
router.get("/users/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [userStats, userAttempts, userSubjects] = await Promise.all([
      getUserStats(userId),
      getUserAttempts(userId, 10),
      getUserSubjects(userId)
    ]);
    
    res.json({
      stats: userStats,
      recentAttempts: userAttempts,
      subjects: userSubjects
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update User Points (Add points)
router.post("/users/:userId/points/add", async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({ error: "Points must be a positive number" });
    }
    
    const updated = await updateUserPoints(userId, parseInt(points));
    
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "Points added successfully" });
  } catch (error) {
    console.error("Error adding user points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set User Points (Exact value)
router.put("/users/:userId/points", async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    
    if (points === undefined || points < 0) {
      return res.status(400).json({ error: "Points must be a non-negative number" });
    }
    
    const updated = await setUserPoints(userId, parseInt(points));
    
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "Points set successfully" });
  } catch (error) {
    console.error("Error setting user points:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete User (Admin only)
router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent self-deletion
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    
    const deleted = await deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

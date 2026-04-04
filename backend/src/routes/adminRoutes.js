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
import {
  createContest,
  getAllContests,
  getContestById,
  updateContest,
  deleteContest,
  updateContestStatus,
  refreshContestStatus,
  assignQuestionsToContest,
  getContestQuestions
} from "../models/contest.model.js";
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

// ==================== CONTEST MANAGEMENT ====================

// Get All Contests (Admin)
router.get("/contests", async (req, res) => {
  try {
    const { status, gradeLevelId, subjectId, limit } = req.query;
    
    // Refresh contest statuses before returning
    await refreshContestStatus();
    
    const contests = await getAllContests({ 
      status, 
      gradeLevelId: gradeLevelId ? parseInt(gradeLevelId) : null, 
      subjectId: subjectId ? parseInt(subjectId) : null, 
      limit: limit ? parseInt(limit) : 50 
    });
    
    res.json({ contests });
  } catch (error) {
    console.error("Error getting contests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Contest by ID (Admin)
router.get("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    
    const contest = await getContestById(parseInt(contestId));
    
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    const questions = await getContestQuestions(parseInt(contestId));
    
    res.json({ contest, questions });
  } catch (error) {
    console.error("Error getting contest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Contest (Admin)
router.post("/contests", async (req, res) => {
  try {
    const { 
      title, 
      description, 
      gradeLevelId, 
      subjectId, 
      questionCount, 
      timePerQuestion, 
      startTime, 
      endTime,
      questionIds
    } = req.body;
    
    // Validation
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ 
        error: "Title, startTime, and endTime are required" 
      });
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ 
        error: "End time must be after start time" 
      });
    }
    
    const contestData = {
      title,
      description,
      gradeLevelId: gradeLevelId || null,
      subjectId: subjectId || null,
      questionCount: questionCount || 10,
      timePerQuestion: timePerQuestion || 30,
      startTime,
      endTime,
      createdBy: req.user.id
    };
    
    const contestId = await createContest(contestData);
    
    // If question IDs provided, assign them to contest
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      await assignQuestionsToContest(contestId, questionIds);
    }
    
    const contest = await getContestById(contestId);
    
    res.status(201).json({ 
      message: "Contest created successfully", 
      contest 
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Contest (Admin)
router.put("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    const { 
      title, 
      description, 
      gradeLevelId, 
      subjectId, 
      questionCount, 
      timePerQuestion, 
      startTime, 
      endTime 
    } = req.body;
    
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ 
        error: "End time must be after start time" 
      });
    }
    
    const contestData = {
      title,
      description,
      gradeLevelId,
      subjectId,
      questionCount,
      timePerQuestion,
      startTime,
      endTime
    };
    
    const updated = await updateContest(parseInt(contestId), contestData);
    
    if (!updated) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    const contest = await getContestById(parseInt(contestId));
    
    res.json({ 
      message: "Contest updated successfully", 
      contest 
    });
  } catch (error) {
    console.error("Error updating contest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Contest Status (Admin)
router.patch("/contests/:contestId/status", async (req, res) => {
  try {
    const { contestId } = req.params;
    const { status } = req.body;
    
    if (!status || !['upcoming', 'active', 'passed'].includes(status)) {
      return res.status(400).json({ 
        error: "Valid status required (upcoming, active, passed)" 
      });
    }
    
    const updated = await updateContestStatus(parseInt(contestId), status);
    
    if (!updated) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    res.json({ message: "Contest status updated successfully" });
  } catch (error) {
    console.error("Error updating contest status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Contest (Admin)
router.delete("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    
    const deleted = await deleteContest(parseInt(contestId));
    
    if (!deleted) {
      return res.status(404).json({ error: "Contest not found" });
    }
    
    res.json({ message: "Contest deleted successfully" });
  } catch (error) {
    console.error("Error deleting contest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh Contest Statuses (Admin)
router.post("/contests/refresh-status", async (req, res) => {
  try {
    const affectedRows = await refreshContestStatus();
    
    res.json({ 
      message: "Contest statuses refreshed", 
      affectedRows 
    });
  } catch (error) {
    console.error("Error refreshing contest statuses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import db from "../config/db.js";
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

// ==================== USER MANAGEMENT ====================

export const getUsersByGrade = async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const { limit = 50 } = req.query;
    
    const users = await getUsersByGradeLevel(gradeLevelId, parseInt(limit));
    res.json({ users });
  } catch (error) {
    console.error("Error getting users by grade level:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTopUsers = async (req, res) => {
  try {
    const { limit = 10, gradeLevelId } = req.query;
    
    const users = await getTopUsersByPoints(parseInt(limit), gradeLevelId ? parseInt(gradeLevelId) : null);
    res.json({ users });
  } catch (error) {
    console.error("Error getting top users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchUsersHandler = async (req, res) => {
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
};

export const getUserStatsHandler = async (req, res) => {
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
};

export const addUserPointsHandler = async (req, res) => {
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
};

export const setUserPointsHandler = async (req, res) => {
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
};

export const deleteUserHandler = async (req, res) => {
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
};

// ==================== CONTEST MANAGEMENT ====================

export const getAllContestsHandler = async (req, res) => {
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
};

export const getContestByIdHandler = async (req, res) => {
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
};

export const createContestHandler = async (req, res) => {
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
      startTime: new Date(startTime).toISOString().slice(0, 19).replace('T', ' '),
      endTime: new Date(endTime).toISOString().slice(0, 19).replace('T', ' '),
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
};

export const updateContestHandler = async (req, res) => {
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
      startTime: startTime ? new Date(startTime).toISOString().slice(0, 19).replace('T', ' ') : undefined,
      endTime: endTime ? new Date(endTime).toISOString().slice(0, 19).replace('T', ' ') : undefined
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
};

export const updateContestStatusHandler = async (req, res) => {
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
};

export const deleteContestHandler = async (req, res) => {
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
};

export const refreshContestStatusesHandler = async (req, res) => {
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
};

export const updateContestQuestionsHandler = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { questionIds } = req.body;
    
    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ error: "questionIds must be an array" });
    }
    
    // Clear existing questions and assign new ones
    await db.promise().query('DELETE FROM contest_questions WHERE contest_id = ?', [contestId]);
    
    if (questionIds.length > 0) {
      const values = questionIds.map((qid, index) => [parseInt(contestId), parseInt(qid), index + 1]);
      const placeholders = values.map(() => '(?, ?, ?)').join(', ');
      const flatValues = values.flat();
      
      await db.promise().query(
        `INSERT INTO contest_questions (contest_id, question_id, question_order) VALUES ${placeholders}`,
        flatValues
      );
    }
    
    // Update question count
    await db.promise().query(
      'UPDATE contests SET question_count = ? WHERE id = ?',
      [questionIds.length, contestId]
    );
    
    res.json({ 
      message: "Contest questions updated successfully",
      questionCount: questionIds.length
    });
  } catch (error) {
    console.error("Error updating contest questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

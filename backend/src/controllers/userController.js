import { getCurrentUserProfile, setupUserProfile as saveUserProfile, getDashboardStatsByUser } from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getCurrentUserProfile(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setupUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { gradeLevelId, subjectIds } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!gradeLevelId || !subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ 
        error: "gradeLevelId and subjectIds array are required" 
      });
    }
    
    const updated = await saveUserProfile(userId, gradeLevelId, subjectIds);

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: userId,
        gradeLevelId,
        subjectIds
      }
    });
  } catch (error) {
    console.error("Error in setupUserProfile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const stats = await getDashboardStatsByUser(userId);

    if (!stats) {
      return res.status(404).json({ error: "User not found" });
    }

    const practiceAttempted = stats.practice_attempted || 0;
    const practiceCorrect = stats.practice_correct || 0;
    const challengeAttempted = stats.challenge_attempted || 0;
    const challengeCorrect = stats.challenge_correct || 0;

    const totalAttempted = practiceAttempted + challengeAttempted;
    const totalCorrect = practiceCorrect + challengeCorrect;
    let accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
    accuracy = Math.max(0, Math.min(100, accuracy));

    res.json({
      points: stats.points || 0,
      accuracy: Math.round(accuracy * 10) / 10,
      totalAttempted
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

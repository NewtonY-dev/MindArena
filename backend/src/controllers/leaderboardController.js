import db from "../config/db.js";

export const getLeaderboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's grade level first
    const userGradeSql = `SELECT grade_level_id FROM users WHERE id = ?`;
    
    db.query(userGradeSql, [userId], (err, userResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      if (userResults.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const gradeLevelId = userResults[0].grade_level_id;
      
      if (!gradeLevelId) {
        return res.status(400).json({ error: "User grade level not set" });
      }
      
      // Get leaderboard for this grade level
      const leaderboardSql = `
        SELECT 
          u.id as user_id,
          u.display_name,
          u.points,
          COUNT(DISTINCT a.id) as practice_attempted,
          SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as practice_correct,
          COUNT(DISTINCT ca.id) as challenge_attempted,
          SUM(CASE WHEN ca.is_correct = 1 THEN 1 ELSE 0 END) as challenge_correct
        FROM users u
        LEFT JOIN attempts a ON u.id = a.user_id
        LEFT JOIN challenge_attempts ca ON u.id = ca.user_id
        WHERE u.grade_level_id = ?
        GROUP BY u.id, u.display_name, u.points
        HAVING u.points > 0
        ORDER BY u.points DESC, 
          (CASE WHEN (COUNT(DISTINCT a.id) + COUNT(DISTINCT ca.id)) > 0 
            THEN (SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) + SUM(CASE WHEN ca.is_correct = 1 THEN 1 ELSE 0 END)) / (COUNT(DISTINCT a.id) + COUNT(DISTINCT ca.id))
            ELSE 0 
          END) DESC
        LIMIT 50
      `;
      
      db.query(leaderboardSql, [gradeLevelId], (err, leaderboardResults) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        
        const rankings = leaderboardResults.map((row, index) => {
          const practiceAttempted = row.practice_attempted || 0;
          const practiceCorrect = row.practice_correct || 0;
          const challengeAttempted = row.challenge_attempted || 0;
          const challengeCorrect = row.challenge_correct || 0;
          
          const totalAttempted = practiceAttempted + challengeAttempted;
          const totalCorrect = practiceCorrect + challengeCorrect;
          let accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
          accuracy = Math.max(0, Math.min(100, accuracy));
          
          return {
            userId: row.user_id,
            displayName: row.display_name,
            points: row.points || 0,
            accuracy: Math.round(accuracy * 10) / 10
          };
        });
        
        res.json({
          gradeLevelId,
          rankings
        });
      });
    });
  } catch (error) {
    console.error("Error in getLeaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
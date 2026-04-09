import db from "../config/db.js";

/**
 * Middleware to enforce profile completion
 * Blocks access to core features until user has set grade level and subjects
 */
const profileCompletionMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if user has completed profile setup
    const checkSql = `
      SELECT u.grade_level_id, COUNT(us.subject_id) as subject_count
      FROM users u
      LEFT JOIN user_subjects us ON u.id = us.user_id
      WHERE u.id = ?
      GROUP BY u.id, u.grade_level_id
    `;
    
    db.query(checkSql, [userId], (err, results) => {
      if (err) {
        console.error("Error checking profile completion:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { grade_level_id, subject_count } = results[0];
      const isProfileComplete = grade_level_id !== null && subject_count > 0;
      
      if (!isProfileComplete) {
        return res.status(403).json({
          error: "Profile setup required",
          profileIncomplete: true,
          required: ["gradeLevelId", "subjectIds"],
          message: "Please complete your profile setup to access this feature"
        });
      }
      
      next();
    });
  } catch (error) {
    console.error("Profile completion middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default profileCompletionMiddleware;

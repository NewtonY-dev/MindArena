import db from "../config/db.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userSql = `
      SELECT u.id, u.email, u.display_name, u.grade_level_id, u.points, u.created_at,
             GROUP_CONCAT(us.subject_id) as subject_ids
      FROM users u
      LEFT JOIN user_subjects us ON u.id = us.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    db.query(userSql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const user = results[0];
      res.json({
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        gradeLevelId: user.grade_level_id,
        subjectIds: user.subject_ids ? user.subject_ids.split(',') : [],
        points: user.points
      });
    });
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
    
    // Use the transaction helper from db config
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Connection error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Transaction error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        
        // Update user profile
        const updateUserSql = `
          UPDATE users 
          SET grade_level_id = ?
          WHERE id = ?
        `;
        
        connection.query(updateUserSql, [gradeLevelId, userId], (err, results) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Database error:", err);
              res.status(500).json({ error: "Internal server error" });
            });
          }
          
          if (results.affectedRows === 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({ error: "User not found" });
            });
          }
          
          // Delete existing subject associations
          const deleteSubjectsSql = `DELETE FROM user_subjects WHERE user_id = ?`;
          
          connection.query(deleteSubjectsSql, [userId], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Database error:", err);
                res.status(500).json({ error: "Internal server error" });
              });
            }
            
            // Insert new subject associations
            const insertSubjectsSql = `
              INSERT INTO user_subjects (user_id, subject_id) 
              VALUES ?
            `;
            
            const subjectValues = subjectIds.map(subjectId => [userId, subjectId]);
            
            connection.query(insertSubjectsSql, [subjectValues], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Database error:", err);
                  res.status(500).json({ error: "Internal server error" });
                });
              }
              
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Commit error:", err);
                    res.status(500).json({ error: "Internal server error" });
                  });
                }
                
                connection.release();
                res.json({ 
                  message: "Profile updated successfully",
                  user: {
                    id: userId,
                    gradeLevelId,
                    subjectIds
                  }
                });
              });
            });
          });
        });
      });
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

    const statsSql = `
      SELECT 
        u.points,
        COUNT(a.id) as total_attempted,
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
      FROM users u
      LEFT JOIN attempts a ON u.id = a.user_id
      WHERE u.id = ?
      GROUP BY u.id, u.points
    `;
    
    db.query(statsSql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const stats = results[0];
      const totalAttempted = stats.total_attempted || 0;
      const correctAnswers = stats.correct_answers || 0;
      const accuracy = totalAttempted > 0 ? (correctAnswers / totalAttempted) * 100 : 0;
      
      res.json({
        points: stats.points || 0,
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal place
        totalAttempted
      });
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
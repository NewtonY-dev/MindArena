import connection from '../config/db.js';

export const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100) NULL,
      grade_level_id INT NULL,
      role VARCHAR(20) DEFAULT 'user',
      points INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id) ON DELETE SET NULL,
      INDEX idx_email (email),
      INDEX idx_grade_level (grade_level_id),
      INDEX idx_points (points DESC)
    );
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Users table created or exists');
        resolve();
      }
    });
  });
};

export const createUser = (userData) => {
  const { email, passwordHash, displayName = null, gradeLevelId = null } = userData;
  const sql = `
    INSERT INTO users (email, password_hash, display_name, grade_level_id, points)
    VALUES (?, ?, ?, ?, 0)
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [email, passwordHash, displayName, gradeLevelId], (err, results) => {
      if (err) reject(err);
      else resolve(results.insertId);
    });
  });
};

export const getUserById = (id) => {
  const sql = `
    SELECT u.id, u.email, u.display_name, u.grade_level_id, u.points, u.created_at,
           gl.name as grade_level_name
    FROM users u
    LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
    WHERE u.id = ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getUserByEmail = (email) => {
  const sql = `
    SELECT u.id, u.email, u.password_hash, u.display_name, u.grade_level_id, u.points, u.created_at,
           gl.name as grade_level_name
    FROM users u
    LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
    WHERE u.email = ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [email], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getUserAuthByEmail = (email) => {
  const sql = `
    SELECT u.id, u.email, u.password_hash, u.display_name, u.grade_level_id, u.points, u.role,
           COUNT(us.subject_id) as subject_count
    FROM users u
    LEFT JOIN user_subjects us ON u.id = us.user_id
    WHERE u.email = ?
    GROUP BY u.id, u.email, u.password_hash, u.display_name, u.grade_level_id, u.points, u.role
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [email], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const getUserWithSubjects = (id) => {
  const sql = `
    SELECT u.id, u.email, u.display_name, u.grade_level_id, u.points, u.created_at,
           gl.name as grade_level_name,
           GROUP_CONCAT(us.subject_id) as subject_ids,
           GROUP_CONCAT(s.name) as subject_names
    FROM users u
    LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
    LEFT JOIN user_subjects us ON u.id = us.user_id
    LEFT JOIN subjects s ON us.subject_id = s.id
    WHERE u.id = ?
    GROUP BY u.id, u.email, u.display_name, u.grade_level_id, u.points, u.created_at, gl.name
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else {
        const user = results[0];
        if (user) {
          user.subjectIds = user.subject_ids ? user.subject_ids.split(',') : [];
          user.subjectNames = user.subject_names ? user.subject_names.split(',') : [];
          delete user.subject_ids;
          delete user.subject_names;
        }
        resolve(user);
      }
    });
  });
};

export const getCurrentUserProfile = (id) => {
  const sql = `
    SELECT u.id, u.email, u.display_name, u.grade_level_id, u.points, u.created_at,
           GROUP_CONCAT(us.subject_id) as subject_ids
    FROM users u
    LEFT JOIN user_subjects us ON u.id = us.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.email, u.display_name, u.grade_level_id, u.points, u.created_at
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else {
        const user = results[0];
        if (!user) {
          resolve(undefined);
          return;
        }

        resolve({
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          gradeLevelId: user.grade_level_id,
          subjectIds: user.subject_ids ? user.subject_ids.split(',').map(Number) : [],
          points: user.points
        });
      }
    });
  });
};

export const setupUserProfile = (userId, gradeLevelId, subjectIds) => {
  return new Promise((resolve, reject) => {
    connection.getConnection((connectionError, dbConnection) => {
      if (connectionError) {
        reject(connectionError);
        return;
      }

      dbConnection.beginTransaction((transactionError) => {
        if (transactionError) {
          dbConnection.release();
          reject(transactionError);
          return;
        }

        dbConnection.query(
          'UPDATE users SET grade_level_id = ? WHERE id = ?',
          [gradeLevelId, userId],
          (updateError, results) => {
            if (updateError) {
              return dbConnection.rollback(() => {
                dbConnection.release();
                reject(updateError);
              });
            }

            if (results.affectedRows === 0) {
              return dbConnection.rollback(() => {
                dbConnection.release();
                resolve(false);
              });
            }

            dbConnection.query('DELETE FROM user_subjects WHERE user_id = ?', [userId], (deleteError) => {
              if (deleteError) {
                return dbConnection.rollback(() => {
                  dbConnection.release();
                  reject(deleteError);
                });
              }

              const values = subjectIds.map((subjectId) => [userId, subjectId]);
              dbConnection.query(
                'INSERT INTO user_subjects (user_id, subject_id) VALUES ?',
                [values],
                (insertError) => {
                  if (insertError) {
                    return dbConnection.rollback(() => {
                      dbConnection.release();
                      reject(insertError);
                    });
                  }

                  dbConnection.commit((commitError) => {
                    if (commitError) {
                      return dbConnection.rollback(() => {
                        dbConnection.release();
                        reject(commitError);
                      });
                    }

                    dbConnection.release();
                    resolve(true);
                  });
                }
              );
            });
          }
        );
      });
    });
  });
};

export const getDashboardStatsByUser = (userId) => {
  const sql = `
    SELECT
      u.points,
      COUNT(DISTINCT a.id) as practice_attempted,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as practice_correct,
      COUNT(DISTINCT ca.id) as challenge_attempted,
      SUM(CASE WHEN ca.is_correct = 1 THEN 1 ELSE 0 END) as challenge_correct
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id
    LEFT JOIN challenge_attempts ca ON u.id = ca.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.points
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const updateUser = (id, userData) => {
  const { displayName, gradeLevelId } = userData;
  const sql = `
    UPDATE users 
    SET display_name = ?, grade_level_id = ?
    WHERE id = ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [displayName, gradeLevelId, id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const updateUserPassword = (id, passwordHash) => {
  const sql = `UPDATE users SET password_hash = ? WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [passwordHash, id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const updateUserPoints = (id, points) => {
  const sql = `UPDATE users SET points = points + ? WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [points, id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const setUserPoints = (id, points) => {
  const sql = `UPDATE users SET points = ? WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [points, id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const deleteUser = (id) => {
  const sql = `DELETE FROM users WHERE id = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results.affectedRows > 0);
    });
  });
};

export const checkEmailExists = (email) => {
  const sql = `SELECT id FROM users WHERE email = ?`;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [email], (err, results) => {
      if (err) reject(err);
      else resolve(results.length > 0);
    });
  });
};

export const getUsersByGradeLevel = (gradeLevelId, limit = 50) => {
  const sql = `
    SELECT u.id, u.email, u.display_name, u.points, u.created_at,
           gl.name as grade_level_name
    FROM users u
    INNER JOIN grade_levels gl ON u.grade_level_id = gl.id
    WHERE u.grade_level_id = ?
    ORDER BY u.points DESC, u.created_at ASC
    LIMIT ?
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [gradeLevelId, limit], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getTopUsersByPoints = (limit = 10, gradeLevelId = null) => {
  let sql = `
    SELECT u.id, u.email, u.display_name, u.points, u.created_at,
           gl.name as grade_level_name
    FROM users u
    LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
  `;
  let params = [];
  
  if (gradeLevelId) {
    sql += ` WHERE u.grade_level_id = ?`;
    params.push(gradeLevelId);
  }
  
  sql += ` ORDER BY u.points DESC, u.created_at ASC LIMIT ?`;
  params.push(limit);
  
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getUserStats = (id) => {
  const sql = `
    SELECT 
      u.points,
      COUNT(a.id) as total_attempts,
      SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
      ROUND(
        CASE 
          WHEN COUNT(a.id) > 0 
          THEN (SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(a.id)) * 100 
          ELSE 0 
        END, 2
      ) as accuracy_percentage,
      COUNT(DISTINCT DATE(a.created_at)) as practice_days,
      MAX(a.created_at) as last_practice_date
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.points
  `;
  
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

export const searchUsers = (query, gradeLevelId = null, limit = 20) => {
  let sql = `
    SELECT u.id, u.email, u.display_name, u.points, u.created_at,
           gl.name as grade_level_name
    FROM users u
    LEFT JOIN grade_levels gl ON u.grade_level_id = gl.id
    WHERE (u.display_name LIKE ? OR u.email LIKE ?)
  `;
  let params = [`%${query}%`, `%${query}%`];
  
  if (gradeLevelId) {
    sql += ` AND u.grade_level_id = ?`;
    params.push(gradeLevelId);
  }
  
  sql += ` ORDER BY u.points DESC LIMIT ?`;
  params.push(limit);
  
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

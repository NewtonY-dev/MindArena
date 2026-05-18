import db from '../config/db.js';
import { getSubjectIdsByGradeLevel } from '../models/gradeSubject.model.js';

export const backfillUserSubjects = async () => {
  console.log('Running migration: backfill user subjects...');

  // Find users who have a grade level but no subjects
  const users = await new Promise((resolve, reject) => {
    db.query(`
      SELECT u.id, u.grade_level_id
      FROM users u
      LEFT JOIN user_subjects us ON u.id = us.user_id
      WHERE u.grade_level_id IS NOT NULL AND us.user_id IS NULL
      GROUP BY u.id, u.grade_level_id
    `, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  console.log(`Found ${users.length} users needing subject backfill`);

  for (const user of users) {
    const subjectIds = await getSubjectIdsByGradeLevel(user.grade_level_id);
    if (subjectIds.length > 0) {
      const values = subjectIds.map(sid => [user.id, sid]);
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT IGNORE INTO user_subjects (user_id, subject_id) VALUES ?',
          [values],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
  }

  console.log('Migration complete: user subjects backfilled');
};
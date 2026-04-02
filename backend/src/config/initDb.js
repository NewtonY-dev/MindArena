import { createGradeLevelsTable } from '../models/gradeLevel.model.js';
import { createSubjectsTable } from '../models/subject.model.js';
import { createUsersTable } from '../models/user.model.js';
import { createQuestionsTable } from '../models/question.model.js';
import { createAttemptsTable } from '../models/attempt.model.js';
import { createUserSubjectsTable } from '../models/userSubject.model.js';
import connection from './db.js';

(async () => {
  try {
    await createGradeLevelsTable();
    await createSubjectsTable();
    await createUsersTable();
    await createUserSubjectsTable();
    await createQuestionsTable();
    await createAttemptsTable();
    console.log('All tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    connection.end();
  }
})();
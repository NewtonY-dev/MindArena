import connection from '../config/db.js';
import { createUsersTable } from './user.model.js';
import { createGradeLevelsTable } from './gradeLevel.model.js';
import { createSubjectsTable } from './subject.model.js';
import { createQuestionsTable } from './question.model.js';
import { createAttemptsTable } from './attempt.model.js';
import { createUserSubjectsTable } from './userSubject.model.js';

export const initializeDatabase = async () => {
  try {
    await createUsersTable();
    await createGradeLevelsTable();
    await createSubjectsTable();
    await createQuestionsTable();
    await createAttemptsTable();
    await createUserSubjectsTable();
    console.log('All database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

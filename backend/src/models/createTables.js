import connection from '../config/db.js';
import { createUsersTable } from './user.model.js';
import { createGradeLevelsTable } from './gradeLevel.model.js';
import { createSubjectsTable } from './subject.model.js';
import { createQuestionsTable } from './question.model.js';
import { createAttemptsTable } from './attempt.model.js';
import { createUserSubjectsTable } from './userSubject.model.js';
import {
  createChallengeRoomsTable,
  createChallengeParticipantsTable,
  createChallengeQuestionsTable,
  createChallengeAttemptsTable,
  createChallengeLeaderboardView
} from './challenge.model.js';
import {
  createContestsTable,
  createContestQuestionsTable,
  createContestParticipantsTable,
  createContestAttemptsTable
} from './contest.model.js';
import { fixContestsTable, fixQuestionsTable, fixContestParticipantsTable } from './fixTables.js';

export const initializeDatabase = async () => {
  try {
    await createUsersTable();
    await createGradeLevelsTable();
    await createSubjectsTable();
    await createQuestionsTable();
    await fixQuestionsTable();
    await createAttemptsTable();
    await createUserSubjectsTable();
    await createChallengeRoomsTable();
    await createChallengeParticipantsTable();
    await createChallengeQuestionsTable();
    await createChallengeAttemptsTable();
    await createChallengeLeaderboardView();
    await createContestsTable();
    await fixContestsTable();
    await createContestQuestionsTable();
    await createContestParticipantsTable();
    await fixContestParticipantsTable();
    await createContestAttemptsTable();
    console.log('All database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

import { createUsersTable } from '../models/user.model.js';
import { createGradeLevelsTable } from '../models/gradeLevel.model.js';
import { createSubjectsTable } from '../models/subject.model.js';
import { createQuestionsTable } from '../models/question.model.js';
import { createAttemptsTable } from '../models/attempt.model.js';
import { createUserSubjectsTable } from '../models/userSubject.model.js';
import {
  createChallengeRoomsTable,
  createChallengeParticipantsTable,
  createChallengeQuestionsTable,
  createChallengeAttemptsTable,
  createChallengeLeaderboardView
} from '../models/challenge.model.js';
import {
  createContestsTable,
  createContestQuestionsTable,
  createContestParticipantsTable,
  createContestAttemptsTable
} from '../models/contest.model.js';
import { fixContestsTable, fixQuestionsTable, fixContestParticipantsTable } from './fixTables.js';
import { createGradeSubjectsTable } from '../models/gradeSubject.model.js';

export const initializeDatabase = async () => {
  try {
    await createUsersTable();
    await createGradeLevelsTable();
    await createSubjectsTable();
    await createQuestionsTable();
    await fixQuestionsTable();
    await createAttemptsTable();
    await createUserSubjectsTable();
    await createGradeSubjectsTable();
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

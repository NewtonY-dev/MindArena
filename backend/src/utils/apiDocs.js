/**
 * API Documentation
 * Centralized endpoint documentation for the MindArena API
 */

import config from '../config/index.js';

export const endpoints = {
  auth: {
    'POST /register': 'Register new user',
    'POST /login': 'Login user'
  },
  users: {
    'GET /me': 'Get current user profile',
    'PATCH /me/profile': 'Setup user profile',
    'GET /me/stats': 'Get dashboard statistics'
  },
  practice: {
    'GET /questions': 'Get practice questions'
  },
  attempts: {
    'POST /': 'Submit answer'
  },
  leaderboard: {
    'GET /': 'Get class leaderboard'
  },
  gradeLevels: {
    'GET /': 'Get all grade levels',
    'GET /:id': 'Get specific grade level'
  },
  subjects: {
    'GET /': 'Get all subjects',
    'GET /:id': 'Get specific subject',
    'GET /grade/:gradeLevelId': 'Get subjects by grade level'
  },
  questions: {
    'GET /grade/:gradeLevelId': 'Get questions by grade',
    'GET /my': 'Get user\'s questions',
    'GET /:id': 'Get question details'
  },
  contests: {
    'GET /': 'Get all contests',
    'GET /:id': 'Get specific contest',
    'POST /:id/start': 'Start a contest',
    'POST /submit': 'Submit contest answer',
    'GET /:id/leaderboard': 'Get contest leaderboard'
  },
  challenges: {
    'POST /create': 'Create 1v1 challenge room',
    'POST /join': 'Join challenge with room code',
    'GET /validate/:roomCode': 'Validate room code',
    'GET /room/:roomCode': 'Get room info',
    'GET /active': 'Get active challenges',
    'GET /history': 'Get challenge history',
    'POST /leave/:roomCode': 'Leave challenge',
    'GET /leaderboard': 'Get challenge leaderboard'
  },
  admin: {
    'GET /users/top': 'Get top users',
    'GET /users/search': 'Search users',
    'GET /users/:userId/stats': 'Get user statistics'
  }
};

export const getApiDocs = (req) => ({
  title: config.APP_NAME,
  version: config.APP_VERSION,
  description: config.APP_DESCRIPTION,
  baseUrl: `${req.protocol}://${req.get('host')}${config.API_PREFIX}`,
  endpoints
});

export default { endpoints, getApiDocs };

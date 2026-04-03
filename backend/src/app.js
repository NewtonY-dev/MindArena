import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import config from "./config/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import gradeLevelRoutes from "./routes/gradeLevelRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contestRoutes from "./routes/contestRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors(config.corsConfig));

// Compression middleware
app.use(compression());

// Rate limiting
app.use(rateLimit(config.rateLimitConfig));

// Logging middleware
if (config.isDevelopment()) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindArena API is running',
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      practice: '/api/practice',
      attempts: '/api/attempts',
      leaderboard: '/api/leaderboard',
      gradeLevels: '/api/grade-levels',
      subjects: '/api/subjects',
      questions: '/api/questions',
      contests: '/api/contests',
      challenges: '/api/challenges',
      admin: '/api/admin'
    }
  });
});

// API Routes
app.use(`${config.API_PREFIX}/auth`, authRoutes);
app.use(`${config.API_PREFIX}/users`, userRoutes);
app.use(`${config.API_PREFIX}/practice`, practiceRoutes);
app.use(`${config.API_PREFIX}/attempts`, attemptRoutes);
app.use(`${config.API_PREFIX}/leaderboard`, leaderboardRoutes);
app.use(`${config.API_PREFIX}/grade-levels`, gradeLevelRoutes);
app.use(`${config.API_PREFIX}/subjects`, subjectRoutes);
app.use(`${config.API_PREFIX}/questions`, questionRoutes);
app.use(`${config.API_PREFIX}/contests`, contestRoutes);
app.use(`${config.API_PREFIX}/challenges`, challengeRoutes);
app.use(`${config.API_PREFIX}/admin`, adminRoutes);

// API Documentation endpoint
app.get(`${config.API_PREFIX}/docs`, (req, res) => {
  res.json({
    title: config.APP_NAME,
    version: config.APP_VERSION,
    description: config.APP_DESCRIPTION,
    baseUrl: `${req.protocol}://${req.get('host')}${config.API_PREFIX}`,
    endpoints: {
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
    }
  });
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;

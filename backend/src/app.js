import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
app.use(helmet());

// CORS configuration
app.use(cors(config.corsConfig));

// Rate limiting
app.use(rateLimit(config.rateLimitConfig));


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindArena API is running',
    version: config.APP_VERSION,
    environment: config.NODE_ENV
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


// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;

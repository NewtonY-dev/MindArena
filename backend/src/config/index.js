import dotenv from 'dotenv';
import './logger.js';

dotenv.config({ quiet: true });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'mindarena',
  DB_PORT: process.env.DB_PORT || 3306,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1h',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  API_PREFIX: '/api',
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  LOG_LEVEL: process.env.LOG_LEVEL || 'error',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif'],
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@mindarena.com',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  CACHE_TTL: parseInt(process.env.CACHE_TTL, 10) || 3600,
  APP_NAME: 'MindArena API',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Educational Learning Platform API',
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION !== 'false',
  ENABLE_PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET === 'true',
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true'
};

config.DATABASE_URL = `mysql://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;

config.validate = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.JWT_SECRET.length < 32 && config.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }

  if (!config.DB_PASSWORD && config.NODE_ENV === 'production') {
    throw new Error('DB_PASSWORD is required in production');
  }

  return true;
};

config.isDevelopment = () => config.NODE_ENV === 'development';
config.isProduction = () => config.NODE_ENV === 'production';
config.isTest = () => config.NODE_ENV === 'test';

config.dbConfig = {
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  charset: 'utf8mb4'
};

config.jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRE,
  issuer: config.APP_NAME,
  audience: 'mindarena-users'
};

config.corsConfig = {
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

config.rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
};

export default config;

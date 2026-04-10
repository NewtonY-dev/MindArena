import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration object
const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'mindarena',
  DB_PORT: process.env.DB_PORT || 3306,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1h',
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // API Configuration
  API_PREFIX: '/api',
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif'],
  
  // Email Configuration (for future features)
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@mindarena.com',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // Cache Configuration
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
  
  // Application Settings
  APP_NAME: 'MindArena API',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Educational Learning Platform API',
  
  // Feature Flags
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION !== 'false',
  ENABLE_PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET === 'true',
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
};

// Database connection string
config.DATABASE_URL = `mysql://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;

// Validation helpers
config.validate = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret strength
  if (config.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
  }
  
  // Validate database configuration
  if (!config.DB_PASSWORD && config.NODE_ENV === 'production') {
    throw new Error('DB_PASSWORD is required in production');
  }
  
  return true;
};

// Development helpers
config.isDevelopment = () => config.NODE_ENV === 'development';
config.isProduction = () => config.NODE_ENV === 'production';
config.isTest = () => config.NODE_ENV === 'test';

// Database configuration for mysql2
config.dbConfig = {
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  charset: 'utf8mb4',
};

// JWT configuration
config.jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRE,
  issuer: config.APP_NAME,
  audience: 'mindarena-users',
};

// CORS configuration
config.corsConfig = {
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Rate limiting configuration
config.rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Log configuration on startup
if (config.isDevelopment()) {
  console.log('🔧 Configuration loaded:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`   Database: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
  console.log(`   JWT Expiry: ${config.JWT_EXPIRE}`);
  console.log(`   CORS Origin: ${config.CORS_ORIGIN}`);
}

export default config;

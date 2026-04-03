// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
  }

  // Database Errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry';
    error.status = 409;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record not found';
    error.status = 400;
  }

  // Cast Errors (Mongoose-like validation)
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format';
    error.status = 400;
  }

  // Development vs Production
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Async Error Wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 Handler
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Custom Error Classes
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}
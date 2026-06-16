// Centralized Error-Handling Middleware
// File: middlewares/errorHandler.js

/**
 * Custom Error class to flag predictable operational client failures (4xx)
 */
export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log detailed error stack on the server side
  console.error(`[ERROR] Status: ${statusCode} | Path: ${req.path} | Msg: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Uniform JSON API response structure
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

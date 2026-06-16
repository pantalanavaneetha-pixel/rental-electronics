import crypto from 'crypto';

/**
 * Custom Error Class to represent client/operational errors
 */
export class ApiError extends Error {
  constructor(statusCode, message, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server.';
  
  // Generate a unique tracking ID for log reconciliation
  const trackingId = crypto.randomUUID();

  // Log full error details on the server side
  console.error(`[ERROR] [Tracking ID: ${trackingId}] [Code: ${errorCode}] Status: ${statusCode} - Message: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const response = {
    success: false,
    error: {
      message,
      errorCode,
      trackingId,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  };

  // Expose stack trace only in non-production environments for debugging
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

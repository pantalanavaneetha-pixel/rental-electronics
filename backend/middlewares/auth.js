// Authentication & Authorization JWT Protection Middleware
// File: middlewares/auth.js

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError } from './errorHandler.js';

/**
 * Protect middleware: enforces that requests have a valid Bearer JWT
 */
export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(401, 'Access Denied: No authentication token found. Please log in first.'));
  }

  try {
    // 1. Verify token validity
    const jwtSecret = process.env.JWT_SECRET || 'rentshield_secret_key_2026_x9b8';
    const decoded = jwt.verify(token, jwtSecret);

    // 2. Check if user still exists in database
    const userRes = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return next(new AppError(401, 'Access Denied: The user account belonging to this token no longer exists.'));
    }

    const user = userRes.rows[0];
    
    // 3. Attach current user context to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'Invalid authentication token. Please log in again.'));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Session expired. Please log in again.'));
    }
    next(err);
  }
};

/**
 * Authorization restrictTo middleware: enforces role privileges
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'Permission Denied: You do not have authorization to perform this action.'));
    }
    next();
  };
};

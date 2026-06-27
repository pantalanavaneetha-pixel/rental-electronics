// Role-Based Access Control (RBAC) Middleware
// File: backend/middlewares/authMiddleware.js

import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError } from './errorHandler.js';

/**
 * authenticateToken Middleware
 * Reads the JWT from the Authorization header (Bearer token), verifies it,
 * and attaches the decoded user payload to the req object.
 */
export const authenticateToken = async (req, res, next) => {
  let token;
  
  // 1. Check for Authorization header with Bearer scheme
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(401, 'Access Denied: No authentication token found. Please log in first.'));
  }

  try {
    // 2. Verify token signature and expiration
    const jwtSecret = process.env.JWT_SECRET || 'rentshield_secret_key_2026_x9b8';
    const decoded = jwt.verify(token, jwtSecret);

    // 3. Query the database to verify the user exists and retrieve current metadata
    const userRes = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    
    if (userRes.rows.length === 0) {
      return next(new AppError(401, 'Access Denied: The user account belonging to this token no longer exists.'));
    }

    // 4. Attach user payload to request object
    req.user = userRes.rows[0];
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
 * requireRole Middleware Factory
 * Checks if the req.user.role is included in the allowedRoles array.
 * If not, returns a 403 Forbidden error.
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Access Denied: Authentication required.'));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'Permission Denied: You do not have authorization to perform this action.'));
    }
    
    next();
  };
};

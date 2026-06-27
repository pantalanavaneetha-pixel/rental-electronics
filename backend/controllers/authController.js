import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * POST /api/auth/login
 * Role-based authentication handler
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(400, 'Please provide email and password.'));
  }

  try {
    // 1. Fetch user by email
    const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
    
    if (result.rows.length === 0) {
      return next(new AppError(401, 'Invalid email address or password.'));
    }

    const user = result.rows[0];

    // 2. Verify hashed password
    // Allow fallback to password verification only if user has a password set
    if (!user.password) {
      return next(new AppError(401, 'Account does not have password login enabled.'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError(401, 'Invalid email address or password.'));
    }

    // 3. Generate JSON Web Token
    const jwtSecret = process.env.JWT_SECRET || 'rentshield_secret_key_2026_x9b8';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // 4. Return success response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

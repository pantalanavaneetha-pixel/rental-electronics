// Auth API Endpoints Routing
// File: routes/auth.js

import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login - Role-based Sign In
router.post('/auth/login', login);

export default router;

// Dashboard API Endpoints Routing
// File: routes/dashboard.js

import express from 'express';
import { getMetrics } from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/metrics
router.get('/dashboard/metrics', getMetrics);

export default router;

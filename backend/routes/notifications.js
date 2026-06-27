// Notifications API Endpoints Routing
// File: routes/notifications.js

import express from 'express';
import { listNotifications, triggerManualNotification, triggerBulkBroadcast } from '../controllers/notificationsController.js';

const router = express.Router();

// 1. GET /api/notifications - List all notification logs (optionally filter by ?rentalId=...)
router.get('/notifications', listNotifications);

// 2. POST /api/notifications/trigger - Trigger simulated notification
router.post('/notifications/trigger', triggerManualNotification);

// 3. POST /api/notifications/broadcast - Trigger simulated bulk campaign broadcast
router.post('/notifications/broadcast', triggerBulkBroadcast);

export default router;

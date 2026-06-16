// Express Server Initialization
// File: server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to: ${req.path}`);
  next();
});

// Single Testing Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Healthy',
    timestamp: new Date().toISOString()
  });
});

import rentalsRouter from './routes/rentals.js';
import dashboardRouter from './routes/dashboard.js';
import claimsRouter from './routes/claims.js';

app.use('/api', rentalsRouter);
app.use('/api', dashboardRouter);
app.use('/api', claimsRouter);

// Centralized Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🛡️  Server listening on port ${PORT}`);
  console.log(`🏥 Health check ready at http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;

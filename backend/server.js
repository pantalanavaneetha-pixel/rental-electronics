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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded assets statically
app.use('/uploads', express.static(uploadsDir));

// Simulated Cloud Storage Upload Endpoint
app.post('/api/upload', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, error: 'No image base64 data provided.' });
  }

  try {
    const matches = image.match(/^data:image\/([A-Za-z\-+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image data URL format.' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    const filename = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, dataBuffer);

    const publicUrl = `http://localhost:${PORT}/uploads/${filename}`;
    console.log(`💾 [LOCAL CLOUD STORAGE] Simulated upload complete: ${filePath} -> ${publicUrl}`);

    res.status(200).json({
      success: true,
      url: publicUrl
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ success: false, error: 'Local storage write failed.' });
  }
});

import rentalsRouter from './routes/rentals.js';
import dashboardRouter from './routes/dashboard.js';
import claimsRouter from './routes/claims.js';
import aiRouter from './routes/ai.js';
import notificationsRouter from './routes/notifications.js';
import authRouter from './routes/auth.js';

app.use('/api', rentalsRouter);
app.use('/api', dashboardRouter);
app.use('/api', claimsRouter);
app.use('/api/ai', aiRouter);
app.use('/api', notificationsRouter);
app.use('/api', authRouter);

// Serve static frontend assets in production if compiled
const clientBuildPath = path.join(__dirname, 'public', 'client');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
      return res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
    next();
  });
}

// Centralized Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🛡️  Server listening on port ${PORT}`);
  console.log(`🏥 Health check ready at http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;

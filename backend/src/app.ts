import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initializeSocket } from './services/socket.js';
import { startStockRecoveryJob } from './jobs/stockRecovery.js';
import dropRoutes from './routes/drop.routes.js';
import usersRouter from './routes/users.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/drops', dropRoutes);
app.use('/api/users', usersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

export { app, initializeSocket, startStockRecoveryJob };

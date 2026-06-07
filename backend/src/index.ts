import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/env.js';
import { initializeSocket } from './services/socket.js';
import { startStockRecoveryJob } from './jobs/stockRecovery.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder for routes - will be implemented next
app.get('/api/drops', (req, res) => {
  res.json({ message: 'Drops endpoint coming soon' });
});

// Start server
httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Start background jobs
startStockRecoveryJob();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

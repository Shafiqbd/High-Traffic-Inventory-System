import { createServer } from 'http';
import { config } from './config/env.js';
import { app, initializeSocket, startStockRecoveryJob } from './app.js';

const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Start server
httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
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

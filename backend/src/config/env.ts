import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Reservation expires after 60 seconds
  reservationExpirySeconds: 60,
  // Stock recovery job runs every 2 seconds for faster UI updates
  stockRecoveryIntervalMs: 2000,
};

import { PrismaClient } from '@prisma/client';

// PrismaClient is a singleton to avoid too many connections in development
// In production, we'd use connection pooling
export const prisma = new PrismaClient();

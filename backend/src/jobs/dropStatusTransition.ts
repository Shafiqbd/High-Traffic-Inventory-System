import { prisma } from '../config/database.js';
import { emitDropActivated, emitDropEnded } from '../services/socket.js';
import { DropStatus } from '@prisma/client';

/**
 * Background job that automatically transitions drop statuses based on time and stock
 * - UPCOMING → ACTIVE: When startsAt time is reached
 * - ACTIVE → ENDED: When stock reaches 0 or 24 hours after start
 * Runs every 30 seconds
 */
export async function processDropStatusTransitions() {
  const now = new Date();

  try {
    // 1. Activate drops 
    const upcomingDrops = await prisma.drop.findMany({
      where: {
        status: DropStatus.UPCOMING,
        startsAt: { lte: now },
      },
    });

    for (const drop of upcomingDrops) {
      const updatedDrop = await prisma.drop.update({
        where: { id: drop.id },
        data: { status: DropStatus.ACTIVE },
      });

      emitDropActivated({
        id: updatedDrop.id,
        name: updatedDrop.name,
        price: updatedDrop.price.toString(),
        initialStock: updatedDrop.initialStock,
        availableStock: updatedDrop.availableStock,
        status: updatedDrop.status,
        startsAt: updatedDrop.startsAt.toISOString(),
        createdAt: updatedDrop.createdAt.toISOString(),
      });

      console.log(`✅ Drop "${drop.name}" (${drop.id}) activated`);
    }

    // 2. End drops 
    const activeDrops = await prisma.drop.findMany({
      where: {
        status: DropStatus.ACTIVE,
        OR: [
          { availableStock: 0 },
          { startsAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });

    for (const drop of activeDrops) {
      await prisma.drop.update({
        where: { id: drop.id },
        data: { status: DropStatus.ENDED },
      });

      emitDropEnded(drop.id);
      console.log(`🏁 Drop "${drop.name}" (${drop.id}) ended`);
    }
  } catch (error) {
    console.error('Error processing drop status transitions:', error);
  }
}

/**
 * Start background job
 */
export function startDropStatusTransitionJob() {
  const intervalMs = 30000; // 30 seconds
  console.log(`🔄 Starting drop status transition job (interval: ${intervalMs}ms)`);
  processDropStatusTransitions(); // Run immediately
  setInterval(processDropStatusTransitions, intervalMs);
}

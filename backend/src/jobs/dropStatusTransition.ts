import { DropStatus } from '@prisma/client';
import { prisma } from '../config/database.js';

import {
  emitDropActivated,
  emitDropEnded,
} from '../services/socket.js';

export async function processDropStatusTransitions() {
  
  const now = new Date();
  console.log('🔄 Running drop status transition job at', now.toISOString());

  console.log("NOW:", now.toISOString());



  try {
    /**
     * UPCOMING -> ACTIVE
     */
    const dropsToActivate =
      await prisma.drop.findMany({
        where: {
          status: DropStatus.UPCOMING,
          startsAt: {
            lte: now,
          },
        },
      });

    console.log(`Found ${dropsToActivate.length} drops to activate`);

    for (const drop of dropsToActivate) {
      const updatedDrop =
        await prisma.drop.update({
          where: {
            id: drop.id,
          },
          data: {
            status: DropStatus.ACTIVE,
          },
        });

      // Fetch recent purchases for this drop
      const recentPurchases = await prisma.purchase.findMany({
        where: { dropId: updatedDrop.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          user: {
            select: { name: true },
          },
        },
      });

      emitDropActivated({
        id: updatedDrop.id,
        name: updatedDrop.name,
        price: updatedDrop.price.toString(),
        initialStock: updatedDrop.initialStock,
        availableStock: updatedDrop.availableStock,
        status: updatedDrop.status,
        startsAt:
          updatedDrop.startsAt.toISOString(),
        endsAt:
          (updatedDrop as any).endsAt?.toISOString() || new Date().toISOString(),
        createdAt:
          updatedDrop.createdAt.toISOString(),
        recentPurchases: recentPurchases.map(p => ({
          id: p.id,
          userName: p.user.name,
          purchasedAt: p.createdAt.toISOString(),
        })),
      });

      console.log(
        `🚀 Drop Activated: ${drop.name}`
      );
    }   

    /**
     * ACTIVE -> ENDED
     */
    const dropsToEnd =
      await prisma.drop.findMany({
        where: {
          status: DropStatus.ACTIVE,
          OR: [
            {
              availableStock: 0,
            },
            {
              endsAt: {
                lte: now,
              },
            },
          ],
        },
      });

    for (const drop of dropsToEnd) {
      const updatedDrop =
        await prisma.drop.update({
          where: {
            id: drop.id,
          },
          data: {
            status: DropStatus.ENDED,
          },
        });

      emitDropEnded(updatedDrop.id);

      console.log(
        `🏁 Drop Ended: ${drop.name}`
      );
    }
  } catch (error) {
    console.error(
      'Error processing drop status transitions:',
      error
    );
  }
}

export function startDropStatusTransitionJob() {
  const intervalMs = 30 * 1000;

  console.log(
    `🔄 Drop scheduler started (${intervalMs}ms)`
  );

  processDropStatusTransitions();

  setInterval(
    processDropStatusTransitions,
    intervalMs
  );
}
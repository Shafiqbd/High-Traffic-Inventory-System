import { prisma } from '../config/database.js';
import { emitStockUpdated, emitReservationExpired } from '../services/socket.js';
import { config } from '../config/env.js';

/**
 * Background job that processes expired reservations
 * and restores stock to the drops.
 * Runs every 10 seconds.
 */
export async function processExpiredReservations() {
  try {
    // Find expired reservations (only ACTIVE ones, skip PURCHASED)
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
        },
      },
      take: 100, // Process in batches to avoid long-running transactions
    });

    if (expiredReservations.length === 0) {
      return;
    }

    console.log(
      `Processing ${expiredReservations.length} expired reservations`
    );

    // Process each expired reservation
    for (const reservation of expiredReservations) {
      await prisma.$transaction(async (tx) => {
        // Lock the drop row
        const drop = await tx.drop.findUnique({
          where: { id: reservation.dropId },
        });

        if (!drop) {
          throw new Error(`Drop ${reservation.dropId} not found`);
        }

        // Increment stock
        const updatedDrop = await tx.drop.update({
          where: { id: reservation.dropId },
          data: {
            availableStock: {
              increment: 1,
            },
          },
        });

        // Delete the reservation
        await tx.reservation.delete({
          where: { id: reservation.id },
        });

        // Emit socket events
        emitStockUpdated(reservation.dropId, updatedDrop.availableStock);
        emitReservationExpired(
          reservation.dropId,
          updatedDrop.availableStock
        );

        console.log(
          `Restored stock for drop ${reservation.dropId}. New stock: ${updatedDrop.availableStock}`
        );
      });
    }
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
}

/**
 * Start the stock recovery background job
 */
export function startStockRecoveryJob() {
  const intervalMs = config.stockRecoveryIntervalMs;

  console.log(`Starting stock recovery job (interval: ${intervalMs}ms)`);

  // Run immediately on start
  processExpiredReservations();

  // Then run on interval
  setInterval(processExpiredReservations, intervalMs);
}

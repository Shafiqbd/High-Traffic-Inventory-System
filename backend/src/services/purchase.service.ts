import { prisma } from '../config/database.js';
import { CreatePurchaseDto } from '../types/purchase.types.js';
import { emitPurchaseCompleted } from './socket.js';

class PurchaseService {
  // Create purchase from active reservation
  async create(data: CreatePurchaseDto) {
    const { dropId, userId } = data;

    console.log('Completing purchase:', data);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find user's active reservation for this drop
      const reservation = await tx.reservation.findUnique({
        where: {
          dropId_userId: {
            dropId,
            userId,
          },
        },
      });

      console.log('reservation:', reservation);

      if (!reservation) {
        throw new Error('No reservation found for this drop');
      }

      // Step 2: Check if reservation is active and not expired
      const now = new Date();
      if (reservation.status !== 'ACTIVE') {
        throw new Error('Reservation is not active');
      }

      if (reservation.expiresAt < now) {
        throw new Error('Reservation has expired');
      }

      // Step 3: Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          dropId,
          userId,
        },
      });

      // Step 4: Update reservation status to PURCHASED
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'PURCHASED' },
      });

      return {
        purchase,
        reservationId: reservation.id,
      };
    });

    // Step 5: Fetch recent purchases (last 3) for activity feed
    const recentPurchases = await prisma.purchase.findMany({
      where: { dropId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const recentPurchasesFormatted = recentPurchases.map((p) => ({
      userName: p.user.name,
      purchasedAt: p.createdAt.toISOString(),
    }));

    // Step 6: Emit Socket.io event for real-time update
    emitPurchaseCompleted(dropId, recentPurchasesFormatted);

    return {
      id: result.purchase.id,
      dropId: result.purchase.dropId,
      userId: result.purchase.userId,
      reservationId: result.reservationId,
      purchasedAt: result.purchase.createdAt.toISOString(),
      message: 'Purchase completed successfully',
    };
  }
}

export default new PurchaseService();

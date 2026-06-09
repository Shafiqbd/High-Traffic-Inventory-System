import { prisma } from '../config/database.js';
import { CreatePurchaseDto } from '../types/purchase.types.js';
import { emitPurchaseCompleted } from './socket.js';

class PurchaseService {
  // Create purchase from active reservation
  async create(data: CreatePurchaseDto) {
    const { dropId, userId } = data;

    console.log('Completing purchase:', data);

    const result = await prisma.$transaction(async (tx) => {
     //Find user's active reservation for this drop
      const reservation = await tx.reservation.findUnique({
        where: {
          dropId_userId: {
            dropId,
            userId,
          },
        },
      });

      if (!reservation) {
        throw new Error('No reservation found for this drop');
      }

      const now = new Date();
      if (reservation.status !== 'ACTIVE') {
        throw new Error('Reservation is not active');
      }

      if (reservation.expiresAt < now) {
        throw new Error('Reservation has expired');
      }

// Create the purchase record
      const purchase = await tx.purchase.create({
        data: {
          dropId,
          userId,
        },
      });

      //  Update reservation
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'PURCHASED' },
      });

      return {
        purchase,
        reservationId: reservation.id,
      };
    });

    // Fetch recent purchases (last 3)
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

    //  Emit  for real-time update
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

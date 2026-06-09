import { prisma } from '../config/database.js';
import type { CreateReservationDto, CancelReservationDto } from '../types/reservation.types.js';
import { ReservationStatus } from '@prisma/client';
import { emitStockUpdated } from './socket.js';

class ReservationService {
  async create(data: CreateReservationDto) {
    const { dropId, userId } = data;

    // Using transaction to ensure atomicity and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Lock the drop row FOR UPDATE to prevent concurrent modifications
      const drop = await tx.drop.findUnique({
        where: { id: dropId },
      });

      if (!drop) {
        throw new Error('Drop not found');
      }

      // Step 2: Check if drop is active
      if (drop.status !== 'ACTIVE') {
        throw new Error('Drop is not active');
      }

      // Step 3: Check stock
      if (drop.availableStock <= 0) {
        throw new Error('No items available');
      }

      // Step 4: Check if user already has a reservation for this drop
      const existingReservation = await tx.reservation.findUnique({
        where: {
          dropId_userId: {
            dropId,
            userId,
          },
        },
      });

      if (existingReservation) {
        // If existing reservation is expired, delete it first
        if (existingReservation.status === 'EXPIRED' || existingReservation.expiresAt < new Date()) {
          await tx.reservation.delete({
            where: { id: existingReservation.id },
          });
        } else if (existingReservation.status === 'ACTIVE') {
          throw new Error('You already have an active reservation for this drop');
        }
      }

      // Step 5: Calculate expiration time (60 seconds from now)
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 60);

      // Step 6: Create the reservation
      const reservation = await tx.reservation.create({
        data: {
          dropId,
          userId,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      // Step 7: Decrement the available stock
      const updatedDrop = await tx.drop.update({
        where: { id: dropId },
        data: {
          availableStock: {
            decrement: 1,
          },
        },
      });

      return {
        reservation,
        updatedStock: updatedDrop.availableStock,
      };
    });

    // Emit stock for real-time notification
    emitStockUpdated(dropId, result.updatedStock);

    return {
      id: result.reservation.id,
      dropId: result.reservation.dropId,
      userId: result.reservation.userId,
      expiresAt: result.reservation.expiresAt.toISOString(),
      status: result.reservation.status,
      createdAt: result.reservation.createdAt.toISOString(),
      availableStock: result.updatedStock,
    };
  }

  // Get reservation by ID
  async findById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        drop: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    if (!reservation) {
      return null;
    }

    const isExpired = reservation.expiresAt < new Date();

    return {
      id: reservation.id,
      dropId: reservation.dropId,
      userId: reservation.userId,
      expiresAt: reservation.expiresAt.toISOString(),
      status: isExpired ? 'EXPIRED' : reservation.status,
      createdAt: reservation.createdAt.toISOString(),
      drop: reservation.drop,
      timeLeft: isExpired ? 0 : Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000),
    };
  }

  // Cancel reservation and restore stock
  async cancel(id: string, data: CancelReservationDto) {
    const { userId } = data;
    let dropId: string = '';

    const result = await prisma.$transaction(async (tx) => {
      // Find the reservation
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      dropId = reservation.dropId;

      if (reservation.userId !== userId) {
        throw new Error('This reservation belongs to another user');
      }

      if (reservation.status === 'PURCHASED') {
        throw new Error('Cannot cancel a purchased reservation');
      }

      if (reservation.status === 'EXPIRED' || reservation.expiresAt < new Date()) {
        throw new Error('Cannot cancel an expired reservation');
      }

      const drop = await tx.drop.findUnique({
        where: { id: reservation.dropId },
      });

      if (!drop) {
        throw new Error('Drop not found');
      }

      // Delete the reservation
      await tx.reservation.delete({
        where: { id },
      });

      const updatedDrop = await tx.drop.update({
        where: { id: reservation.dropId },
        data: {
          availableStock: {
            increment: 1,
          },
        },
      });

      return updatedDrop.availableStock;
    });

    // Emit stock
    emitStockUpdated(dropId, result);

    return {
      success: true,
      message: 'Reservation cancelled successfully',
      restoredStock: result,
    };
  }

}

export default new ReservationService();

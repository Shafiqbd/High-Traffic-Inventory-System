import { prisma } from '../config/database.js';
import { emitDropCreated, emitStockUpdated } from '../services/socket.js';
import { DropStatus, Prisma } from '@prisma/client';
import type { CreateDropDto, UpdateDropDto, UpdateDropStatusDto, DropQuery } from '../types/drop.types.js';

class DropService {
  // Get all drops with optional filtering
  async findAll() {
    const drops = await prisma.drop.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const result = [];
    for (const drop of drops) {
      const recentPurchases = await prisma.purchase.findMany({
        where: { dropId: drop.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      result.push({
        ...this.formatDrop(drop),
        recentPurchases: recentPurchases.map((p) => ({
          id: p.id,
          userName: p.user.name,
          purchasedAt: p.createdAt.toISOString(),
        })),
      });
    }

    return result;
  }

  // Get single drop by ID with recent purchases
  async findById(id: string) {
    const drop = await prisma.drop.findUnique({
      where: { id },
    });

    if (!drop) {
      return null;
    }

    const recentPurchases = await prisma.purchase.findMany({
      where: { dropId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    return {
      ...this.formatDrop(drop),
      recentPurchases: recentPurchases.map((p) => ({
        id: p.id,
        userName: p.user.name,
        purchasedAt: p.createdAt.toISOString(),
      })),
    };
  }

  // Create new drop
  async create(data: CreateDropDto) {
    const { name, price, initialStock, startsAt, status } = data;

    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    const startDate = startsAt ? new Date(startsAt) : new Date();


    const drop = await prisma.drop.create({
      data: {
        name,
        price: priceNum,
        initialStock,
        availableStock: initialStock,
        startsAt: startDate,
        status
      },
    });

    // Emit socket event
    emitDropCreated(this.formatDrop(drop));

    return this.formatDrop(drop);
  }

  // Update drop
  async update(id: string, data: UpdateDropDto) {
    const existingDrop = await prisma.drop.findUnique({
      where: { id },
    });

    if (!existingDrop) {
      return null;
    }

    const updateData: Prisma.DropUpdateInput = {};

    if (data.name) updateData.name = data.name;
    if (data.price) updateData.price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    if (data.initialStock !== undefined) {
      updateData.initialStock = data.initialStock;
      if (existingDrop.availableStock === existingDrop.initialStock) {
        updateData.availableStock = data.initialStock;
      }
    }
    if (data.startsAt) updateData.startsAt = new Date(data.startsAt);
    if (data.status) updateData.status = data.status as DropStatus;

    const updatedDrop = await prisma.drop.update({
      where: { id },
      data: updateData,
    });

    // Emit stock update if stock changed
    if (updateData.availableStock !== undefined) {
      emitStockUpdated(id, updatedDrop.availableStock);
    }

    return this.formatDrop(updatedDrop);
  }

  // Update drop status only
  async updateStatus(id: string, data: UpdateDropStatusDto) {
    const drop = await prisma.drop.findUnique({
      where: { id },
    });

    if (!drop) {
      return null;
    }

    const updatedDrop = await prisma.drop.update({
      where: { id },
      data: { status: data.status as DropStatus },
    });

    return {
      id: updatedDrop.id,
      name: updatedDrop.name,
      status: updatedDrop.status,
    };
  }

  // Delete drop
  async delete(id: string) {
    const drop = await prisma.drop.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: true,
            purchases: true,
          },
        },
      },
    });

    if (!drop) {
      return null;
    }

    // Don't allow deletion if there are reservations or purchases
    if (drop._count.reservations > 0 || drop._count.purchases > 0) {
      throw new Error('Cannot delete drop with existing reservations or purchases');
    }

    await prisma.drop.delete({
      where: { id },
    });

    return true;
  }

  // Helper: Format drop for API response
  private formatDrop(drop: any) {
    return {
      id: drop.id,
      name: drop.name,
      price: drop.price.toFixed(2),
      initialStock: drop.initialStock,
      availableStock: drop.availableStock,
      status: drop.status,
      startsAt: drop.startsAt.toISOString(),
      createdAt: drop.createdAt.toISOString(),
    };
  }
}

export default new DropService();

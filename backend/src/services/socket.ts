import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a drop room to receive updates for that drop
    socket.on('join:drop', ({ dropId }) => {
      const roomName = `drop:${dropId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Leave a drop room
    socket.on('leave:drop', ({ dropId }) => {
      const roomName = `drop:${dropId}`;
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left room ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Helper functions to emit events

export function emitStockUpdated(dropId: string, availableStock: number) {
  const roomName = `drop:${dropId}`;
  getSocketIO().to(roomName).emit('stock:updated', { dropId, availableStock });
}

export function emitDropCreated(drop: any) {
  getSocketIO().emit('drop:created', drop);
}

export function emitPurchaseCompleted(dropId: string, recentPurchases: any[]) {
  const roomName = `drop:${dropId}`;
  getSocketIO().to(roomName).emit('purchase:completed', {
    dropId,
    recentPurchases,
  });
}

export function emitReservationExpired(dropId: string, availableStock: number) {
  const roomName = `drop:${dropId}`;
  getSocketIO().to(roomName).emit('reservation:expired', {
    dropId,
    availableStock,
  });
}

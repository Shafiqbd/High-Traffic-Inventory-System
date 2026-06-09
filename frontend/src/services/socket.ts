import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Get socket server URL from API URL (remove /api suffix)
const getSocketServerUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  // Only remove /api if it's at the end of the URL
  const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  console.log('Socket server URL:', socketUrl, 'from API URL:', apiUrl);
  return socketUrl;
};

export function initializeSocket(): Socket {
  if (socket) {
    console.log('Returning existing socket instance');
    return socket;
  }

  const serverUrl = getSocketServerUrl();
  console.log('Initializing new socket connection to', serverUrl);

  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ Connected to Socket.io server with ID:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from Socket.io server:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('⚠️ Socket.io connection error:', error);
  });

  return socket;
}

export function getSocket(): Socket {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket() first.');
  }
  return socket;
}

export function joinDrop(dropId: string): void {
  const sock = getSocket();
  sock.emit('join:drop', { dropId });
}

export function leaveDrop(dropId: string): void {
  const sock = getSocket();
  sock.emit('leave:drop', { dropId });
}

export function onStockUpdated(callback: (data: { dropId: string; availableStock: number }) => void): void {
  const sock = getSocket();
  sock.on('stock:updated', callback);
}

export function onDropCreated(callback: (drop: any) => void): void {
  const sock = getSocket();
  sock.on('drop:created', callback);
}

export function onPurchaseCompleted(callback: (data: { dropId: string; recentPurchases: any[] }) => void): void {
  const sock = getSocket();
  sock.on('purchase:completed', callback);
}

export function onReservationExpired(callback: (data: { dropId: string; availableStock: number }) => void): void {
  const sock = getSocket();
  sock.on('reservation:expired', callback);
}

// Cleanup function to remove all listeners
export function cleanupSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Frontend] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO Frontend] Disconnected:', reason);
    });
  }
  return socket;
}

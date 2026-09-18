const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.IO with HTTP server instance
 * @param {Object} httpServer - HTTP Server instance
 * @param {String|Array} allowedOrigins - CORS allowed origin(s)
 */
function initSocket(httpServer, allowedOrigins = '*') {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Allow clients to join a room for a specific device if needed
    socket.on('subscribe_device', (deviceId) => {
      if (deviceId) {
        socket.join(`device:${deviceId}`);
        console.log(`[Socket.IO] Client ${socket.id} subscribed to device:${deviceId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get active Socket.IO server instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized!');
  }
  return io;
}

/**
 * Broadcast new telemetry reading to connected clients
 * @param {Object} reading - Document or JSON object of reading
 */
function broadcastNewReading(reading) {
  if (!io) {
    console.warn('[Socket.IO] Warning: io instance not ready, skip broadcast');
    return;
  }

  // Convert Mongoose doc to plain object if needed
  const data = reading.toObject ? reading.toObject() : reading;

  // Emit globally to all connected clients on 'new_reading'
  io.emit('new_reading', data);

  // Also emit to specific device room if subscribed
  if (data.device_id) {
    io.to(`device:${data.device_id}`).emit('device_reading', data);
  }

  console.log(`[Socket.IO] Broadcasted 'new_reading' for device: ${data.device_id}`);
}

module.exports = {
  initSocket,
  getIO,
  broadcastNewReading
};

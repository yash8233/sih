const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketManager');
const readingRoutes = require('./routes/readingRoutes');

// Initialize Express app
const app = express();

// Middleware setup
const allowedOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'IoT Water Quality Monitoring Backend',
    timestamp: new Date().toISOString()
  });
});

// Register API Routes
app.use('/api', readingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[App Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Create HTTP server & attach Socket.IO
const server = http.createServer(app);
initSocket(server, allowedOrigins);

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` 💧 Real-time IoT Water Quality Server Listening `);
    console.log(` 🚀 HTTP API: http://localhost:${PORT}/api`);
    console.log(` 🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(` 🌐 CORS Allowed Origin: ${allowedOrigins}`);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error('[Server Startup Failure]', err);
});

module.exports = { app, server };

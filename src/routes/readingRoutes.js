const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const { requireDeviceApiKey } = require('../middleware/authMiddleware');

// Health check route
router.get('/health', readingController.getHealthStatus);

// Ingest sensor reading (requires x-device-key header matching DEVICE_API_KEY)
router.post('/readings', requireDeviceApiKey, readingController.createReading);

// Get latest reading for a device
router.get('/readings/latest', readingController.getLatestReading);

// Get history telemetry data for charts (range=hour|day|week)
router.get('/readings/history', readingController.getReadingHistory);

// Dev simulation route (does NOT require x-device-key)
router.post('/simulate', readingController.simulateReading);

// Threshold configuration route
router.get('/thresholds', readingController.getThresholds);

// Reset demo readings collection (requires x-device-key header)
router.delete('/readings/reset', requireDeviceApiKey, readingController.resetAllReadings);

module.exports = router;

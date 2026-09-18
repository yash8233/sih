const Reading = require('../models/Reading');
const { evaluateThresholds, WATER_THRESHOLDS } = require('../config/thresholds');
const { broadcastNewReading } = require('../socket/socketManager');

/**
 * Helper to validate numerical ranges / presence
 */
function validateReadingPayload(body) {
  const errors = [];
  if (!body.device_id || typeof body.device_id !== 'string' || !body.device_id.trim()) {
    errors.push('device_id is required and must be a non-empty string');
  }

  const requiredNumericFields = ['ph', 'turbidity_ntu', 'tds_ppm', 'temperature_c'];
  requiredNumericFields.forEach(field => {
    if (body[field] === undefined || body[field] === null || isNaN(Number(body[field]))) {
      errors.push(`${field} is required and must be a valid number`);
    }
  });

  const optionalNumericFields = ['flow_lpm', 'water_level_percent'];
  optionalNumericFields.forEach(field => {
    if (body[field] !== undefined && body[field] !== null && isNaN(Number(body[field]))) {
      errors.push(`${field} must be a valid number if provided`);
    }
  });

  return errors;
}

/**
 * Helper function to save reading and broadcast live update
 */
async function processAndSaveReading(readingData) {
  const parseOptionalNumber = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  // 1. Evaluate threshold breaches
  const alerts = evaluateThresholds(readingData);

  // 2. Build model instance
  const reading = new Reading({
    device_id: readingData.device_id,
    timestamp: readingData.timestamp ? new Date(readingData.timestamp) : new Date(),
    ph: Number(readingData.ph),
    turbidity_ntu: Number(readingData.turbidity_ntu),
    tds_ppm: Number(readingData.tds_ppm),
    temperature_c: Number(readingData.temperature_c),
    flow_lpm: parseOptionalNumber(readingData.flow_lpm),
    water_level_percent: parseOptionalNumber(readingData.water_level_percent),
    purification_status: readingData.purification_status || 'active',
    alerts
  });

  // 3. Save to MongoDB
  const savedReading = await reading.save();

  // 4. Emit via Socket.IO
  broadcastNewReading(savedReading);

  return savedReading;
}

/**
 * POST /api/readings
 * Ingest IoT water telemetry reading from sensor/device
 */
exports.createReading = async (req, res) => {
  try {
    const validationErrors = validateReadingPayload(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const savedReading = await processAndSaveReading(req.body);

    return res.status(201).json({
      success: true,
      message: 'Reading ingested and broadcasted successfully',
      data: savedReading
    });
  } catch (error) {
    console.error('[Controller] Error in createReading:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record sensor reading',
      error: error.message
    });
  }
};

/**
 * GET /api/readings/latest
 * Return most recent telemetry reading for a given device_id
 */
exports.getLatestReading = async (req, res) => {
  try {
    const { device_id } = req.query;

    const filter = {};
    if (device_id) {
      filter.device_id = device_id;
    }

    const latest = await Reading.findOne(filter).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: device_id
          ? `No telemetry readings found for device_id: ${device_id}`
          : 'No telemetry readings found in system'
      });
    }

    return res.status(200).json({
      success: true,
      data: latest
    });
  } catch (error) {
    console.error('[Controller] Error in getLatestReading:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch latest reading',
      error: error.message
    });
  }
};

/**
 * GET /api/readings/history?device_id=&range=hour|day|week
 * Returns historical readings filtered by range for charting
 */
exports.getReadingHistory = async (req, res) => {
  try {
    const { device_id, range = 'day' } = req.query;

    const filter = {};
    if (device_id) {
      filter.device_id = device_id;
    }

    // Determine target start time
    const now = new Date();
    let startTime = new Date();

    switch (range.toLowerCase()) {
      case 'hour':
        startTime.setHours(now.getHours() - 1);
        break;
      case 'week':
        startTime.setDate(now.getDate() - 7);
        break;
      case 'day':
      default:
        startTime.setDate(now.getDate() - 1);
        break;
    }

    filter.timestamp = { $gte: startTime };

    // Fetch chronological readings for plotting charts (ascending timestamp order)
    const history = await Reading.find(filter)
      .sort({ timestamp: 1 })
      .limit(1000);

    return res.status(200).json({
      success: true,
      count: history.length,
      range,
      startTime,
      endTime: now,
      data: history
    });
  } catch (error) {
    console.error('[Controller] Error in getReadingHistory:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch history readings',
      error: error.message
    });
  }
};

/**
 * POST /api/simulate
 * Dev-only simulation endpoint to generate fake realistic telemetry readings
 */
exports.simulateReading = async (req, res) => {
  try {
    const deviceId = req.body.device_id || 'ESP32-DEV-01';

    // Helper for random float in range fixed to 2 decimals
    const randomFloat = (min, max, decimals = 2) => {
      const val = Math.random() * (max - min) + min;
      return parseFloat(val.toFixed(decimals));
    };

    // Realistic IoT parameters generator
    const fakePayload = {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      ph: randomFloat(6.5, 8.5, 2),
      turbidity_ntu: randomFloat(0.5, 9.5, 2),
      tds_ppm: Math.round(randomFloat(100, 500, 0)),
      temperature_c: randomFloat(20.0, 30.0, 1),
      flow_lpm: randomFloat(2.0, 15.0, 1),
      water_level_percent: Math.round(randomFloat(45, 98, 0)),
      purification_status: ['active', 'filtering', 'idle'][Math.floor(Math.random() * 3)]
    };

    const savedReading = await processAndSaveReading(fakePayload);

    return res.status(201).json({
      success: true,
      isSimulated: true,
      message: 'Simulated reading generated, saved, and broadcasted',
      data: savedReading
    });
  } catch (error) {
    console.error('[Controller] Error in simulateReading:', error);
    return res.status(500).json({
      success: false,
      message: 'Simulation failed',
      error: error.message
    });
  }
};

/**
 * GET /api/health
 * Returns status "ok" and timestamp of most recent reading across all devices (or null)
 */
exports.getHealthStatus = async (req, res) => {
  try {
    const latest = await Reading.findOne().sort({ timestamp: -1 }).select('timestamp');
    return res.status(200).json({
      status: 'ok',
      last_reading_at: latest ? latest.timestamp.toISOString() : null
    });
  } catch (error) {
    console.error('[Controller] Error in getHealthStatus:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};

/**
 * GET /api/thresholds
 * Endpoint to retrieve threshold configuration for alerts UI
 */
exports.getThresholds = (req, res) => {
  return res.status(200).json({
    success: true,
    data: WATER_THRESHOLDS
  });
};

/**
 * DELETE /api/readings/reset
 * Deletes all telemetry documents in the readings collection. Requires x-device-key header.
 */
exports.resetAllReadings = async (req, res) => {
  try {
    const result = await Reading.deleteMany({});
    return res.status(200).json({
      success: true,
      message: 'All telemetry readings successfully reset',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('[Controller] Error in resetAllReadings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while resetting readings',
      error: error.message
    });
  }
};


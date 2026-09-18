/**
 * Threshold configuration for Water Quality Monitoring
 * Used to trigger alerts when water parameters breach safe standards.
 */
const WATER_THRESHOLDS = {
  ph: {
    min: 6.5,
    max: 8.5,
    unit: 'pH',
    description: 'Safe drinking water pH range is between 6.5 and 8.5'
  },
  turbidity_ntu: {
    max: 5.0,
    unit: 'NTU',
    description: 'Turbidity should ideally be below 5 NTU for safe clarity'
  },
  tds_ppm: {
    max: 500.0,
    unit: 'ppm',
    description: 'Total Dissolved Solids should be under 500 ppm'
  },
  temperature_c: {
    min: 5.0,
    max: 40.0,
    unit: '°C',
    description: 'Normal water temperature range'
  }
};

/**
 * Evaluates a telemetry reading object against thresholds.
 * @param {Object} reading
 * @returns {Array<Object>} List of triggered alerts (if any)
 */
function evaluateThresholds(reading) {
  const alerts = [];

  // Evaluate pH
  if (reading.ph !== undefined && reading.ph !== null) {
    if (reading.ph < WATER_THRESHOLDS.ph.min) {
      alerts.push({
        parameter: 'ph',
        level: 'WARNING',
        value: reading.ph,
        message: `pH level (${reading.ph}) is below minimum safe threshold (${WATER_THRESHOLDS.ph.min})`
      });
    } else if (reading.ph > WATER_THRESHOLDS.ph.max) {
      alerts.push({
        parameter: 'ph',
        level: 'WARNING',
        value: reading.ph,
        message: `pH level (${reading.ph}) exceeds maximum safe threshold (${WATER_THRESHOLDS.ph.max})`
      });
    }
  }

  // Evaluate Turbidity
  if (reading.turbidity_ntu !== undefined && reading.turbidity_ntu !== null) {
    if (reading.turbidity_ntu > WATER_THRESHOLDS.turbidity_ntu.max) {
      alerts.push({
        parameter: 'turbidity_ntu',
        level: 'WARNING',
        value: reading.turbidity_ntu,
        message: `Turbidity (${reading.turbidity_ntu} NTU) exceeds threshold (${WATER_THRESHOLDS.turbidity_ntu.max} NTU)`
      });
    }
  }

  // Evaluate TDS
  if (reading.tds_ppm !== undefined && reading.tds_ppm !== null) {
    if (reading.tds_ppm > WATER_THRESHOLDS.tds_ppm.max) {
      alerts.push({
        parameter: 'tds_ppm',
        level: 'WARNING',
        value: reading.tds_ppm,
        message: `TDS (${reading.tds_ppm} ppm) exceeds maximum limit (${WATER_THRESHOLDS.tds_ppm.max} ppm)`
      });
    }
  }

  // Evaluate Temperature
  if (reading.temperature_c !== undefined && reading.temperature_c !== null) {
    if (reading.temperature_c < WATER_THRESHOLDS.temperature_c.min) {
      alerts.push({
        parameter: 'temperature_c',
        level: 'WARNING',
        value: reading.temperature_c,
        message: `Temperature (${reading.temperature_c}°C) is below minimum threshold (${WATER_THRESHOLDS.temperature_c.min}°C)`
      });
    } else if (reading.temperature_c > WATER_THRESHOLDS.temperature_c.max) {
      alerts.push({
        parameter: 'temperature_c',
        level: 'WARNING',
        value: reading.temperature_c,
        message: `Temperature (${reading.temperature_c}°C) exceeds maximum threshold (${WATER_THRESHOLDS.temperature_c.max}°C)`
      });
    }
  }

  return alerts;
}

module.exports = {
  WATER_THRESHOLDS,
  evaluateThresholds
};

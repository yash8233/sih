const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  level: { type: String, default: 'WARNING' },
  value: { type: Number, required: true },
  message: { type: String, required: true }
}, { _id: false });

const ReadingSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: [true, 'device_id is required'],
    trim: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ph: {
    type: Number,
    required: [true, 'ph is required']
  },
  turbidity_ntu: {
    type: Number,
    required: [true, 'turbidity_ntu is required']
  },
  tds_ppm: {
    type: Number,
    required: [true, 'tds_ppm is required']
  },
  temperature_c: {
    type: Number,
    required: [true, 'temperature_c is required']
  },
  flow_lpm: {
    type: Number,
    default: null
  },
  water_level_percent: {
    type: Number,
    default: null
  },
  purification_status: {
    type: String,
    enum: ['active', 'idle', 'filtering', 'error', 'maintenance'],
    default: 'active'
  },
  alerts: [AlertSchema]
}, {
  timestamps: true,
  collection: 'readings'
});

// Index for efficient historical range queries by device and timestamp
ReadingSchema.index({ device_id: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', ReadingSchema);

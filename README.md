# 💧 Real-time IoT Water Quality Monitoring System - Backend

A high-performance Node.js, Express, MongoDB, and Socket.IO backend built for ingesting, processing, and broadcasting real-time water quality telemetry from IoT devices (e.g. ESP32).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Communication**: Socket.IO (WebSockets)
- **CORS Support**: Configured for frontend apps (default `http://localhost:5173`)

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local service, Docker, or MongoDB Atlas cluster)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

Set your configuration variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/water_quality_db
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

#### 📌 Exact MongoDB Connection String Formats:

- **Local MongoDB Daemon (Default)**:
  `mongodb://127.0.0.1:27017/water_quality_db`
- **MongoDB Atlas (Cloud)**:
  `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/water_quality_db?retryWrites=true&w=majority`
- **Docker MongoDB**:
  `mongodb://admin:password@localhost:27017/water_quality_db?authSource=admin`

---

## 🏃 Running the Server

### Development Mode (with hot reloading via nodemon):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

### Automated Integration Test Suite (In-Memory Database):
```bash
npm test
```

---

## 📡 REST API Reference

### 1. Ingest Telemetry Reading
- **Endpoint**: `POST /api/readings`
- **Headers**:
  - `Content-Type: application/json`
  - `x-device-key`: `<DEVICE_API_KEY from .env>` *(Required for device POST)*
- **Body Request**:
```json
{
  "device_id": "ESP32-WATER-01",
  "ph": 7.4,
  "turbidity_ntu": 2.1,
  "tds_ppm": 220,
  "temperature_c": 24.5,
  "flow_lpm": 6.5,
  "water_level_percent": 88,
  "purification_status": "filtering"
}
```
- **Response** `(201 Created)`:
```json
{
  "success": true,
  "message": "Reading ingested and broadcasted successfully",
  "data": {
    "device_id": "ESP32-WATER-01",
    "ph": 7.4,
    "turbidity_ntu": 2.1,
    "tds_ppm": 220,
    "temperature_c": 24.5,
    "flow_lpm": 6.5,
    "water_level_percent": 88,
    "purification_status": "filtering",
    "alerts": [],
    "_id": "65e2a1b9f8d9b123456789ab",
    "timestamp": "2026-09-17T23:15:00.000Z"
  }
}
```
- **Unauthorized Response** `(401 Unauthorized)`:
```json
{
  "success": false,
  "message": "Unauthorized: Missing or invalid x-device-key header"
}
```

---

### 2. System Health Check
- **Endpoint**: `GET /api/health`
- **Response** `(200 OK)`:
```json
{
  "status": "ok",
  "last_reading_at": "2026-09-17T23:15:00.000Z" // ISO String timestamp of most recent reading or null if no readings exist
}
```

---

### 2. Get Latest Reading
- **Endpoint**: `GET /api/readings/latest?device_id=ESP32-WATER-01`
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "data": {
    "device_id": "ESP32-WATER-01",
    "ph": 7.4,
    "turbidity_ntu": 2.1,
    "tds_ppm": 220,
    "temperature_c": 24.5,
    "flow_lpm": 6.5,
    "water_level_percent": 88,
    "purification_status": "filtering",
    "alerts": [],
    "timestamp": "2026-09-17T23:15:00.000Z"
  }
}
```

---

### 3. Get Reading History (for Charts)
- **Endpoint**: `GET /api/readings/history?device_id=ESP32-WATER-01&range=hour|day|week`
- **Query Parameters**:
  - `device_id` (optional): Filter by specific device
  - `range` (optional): `hour` (past 1 hr), `day` (past 24 hrs - default), or `week` (past 7 days)
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "count": 48,
  "range": "day",
  "startTime": "2026-09-16T23:15:00.000Z",
  "endTime": "2026-09-17T23:15:00.000Z",
  "data": [ ...array of chronologically sorted readings... ]
}
```

---

### 4. Developer Telemetry Simulation (Dev-Only)
- **Endpoint**: `POST /api/simulate`
- **Body Request** (optional):
```json
{
  "device_id": "ESP32-DEV-01"
}
```
Generates realistic randomized telemetry parameters (pH ~6.5-8.5, turbidity ~0-10 NTU, TDS ~100-500 ppm, temp ~20-30°C), saves to MongoDB, and broadcasts to connected Socket.IO frontend clients.

---

### 5. Get Threshold Configurations
- **Endpoint**: `GET /api/thresholds`
- **Response** `(200 OK)`:
```json
{
  "success": true,
  "data": {
    "ph": { "min": 6.5, "max": 8.5, "unit": "pH" },
    "turbidity_ntu": { "max": 5.0, "unit": "NTU" },
    "tds_ppm": { "max": 500.0, "unit": "ppm" }
  }
}
```

---

## ⚡ Socket.IO Real-Time Client Integration

Frontend apps can listen to live telemetry broadcasts instantly:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Connected to Water Quality Socket.IO server:', socket.id);
});

// Listen to all incoming telemetry readings
socket.on('new_reading', (reading) => {
  console.log('⚡ Live IoT Telemetry:', reading);
  // Update React / Vue / Vite chart & metrics dashboard state
});

// Subscribe to specific device telemetry room
socket.emit('subscribe_device', 'ESP32-WATER-01');
socket.on('device_reading', (reading) => {
  console.log('📱 Device-Specific Telemetry:', reading);
});
```

---

## 🎯 Water Quality Threshold Standards

| Parameter | Safe Range / Max | Unit | Description |
|---|---|---|---|
| **pH** | 6.5 – 8.5 | pH | WHO/BIS drinking water standard |
| **Turbidity** | ≤ 5.0 | NTU | Water clarity limit |
| **TDS** | ≤ 500.0 | ppm | Total Dissolved Solids threshold |
# sih

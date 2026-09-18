const http = require('http');
const express = require('express');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { io: Client } = require('socket.io-client');
const assert = require('assert');

process.env.DEVICE_API_KEY = 'test_secret_key_xyz';

const { initSocket } = require('../src/socket/socketManager');
const readingRoutes = require('../src/routes/readingRoutes');
const Reading = require('../src/models/Reading');

async function runTests() {
  console.log('🧪 Starting Expanded IoT Water Quality Backend Test Suite (Phase 5)...\n');

  // 1. Start In-Memory MongoDB Server
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  console.log(`[Test] In-Memory Mongo URI: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  // Ensure indexes are built
  await Reading.init();

  // 2. Setup Express & HTTP Server & Socket.IO
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', readingRoutes);

  const server = http.createServer(app);
  initSocket(server, '*');

  await new Promise((resolve) => server.listen(0, resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;
  console.log(`[Test] Server running on ${baseUrl}`);

  // 3. Connect Socket.IO Test Client
  const socketClient = Client(baseUrl);
  await new Promise((resolve) => socketClient.on('connect', resolve));
  console.log(`[Test] Socket.IO test client connected (ID: ${socketClient.id})`);

  let receivedSocketEvents = [];
  socketClient.on('new_reading', (data) => {
    receivedSocketEvents.push(data);
  });

  // TEST 1: Initial GET /api/health (when database has no readings)
  console.log('\n--- TEST 1: Initial GET /api/health (last_reading_at = null) ---');
  const resHealth1 = await fetch(`${baseUrl}/api/health`);
  const dataHealth1 = await resHealth1.json();
  assert.strictEqual(resHealth1.status, 200);
  assert.strictEqual(dataHealth1.status, 'ok');
  assert.strictEqual(dataHealth1.last_reading_at, null);
  console.log('✅ TEST 1 PASSED: GET /api/health returned { status: "ok", last_reading_at: null }');

  // TEST 2: Header x-device-key Authentication Rejection (Missing Key)
  console.log('\n--- TEST 2: POST /api/readings without x-device-key (Expect 401) ---');
  const validReadingPayload = {
    device_id: 'ESP32-WATER-01',
    ph: 7.2,
    turbidity_ntu: 3.4,
    tds_ppm: 250,
    temperature_c: 24.5,
    flow_lpm: 5.2,
    water_level_percent: 85,
    purification_status: 'filtering'
  };

  const resAuthMissing = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validReadingPayload)
  });
  const dataAuthMissing = await resAuthMissing.json();
  assert.strictEqual(resAuthMissing.status, 401);
  assert.strictEqual(dataAuthMissing.success, false);
  console.log('✅ TEST 2 PASSED: Missing x-device-key header rejected with 401');

  // TEST 3: Header x-device-key Authentication Rejection (Wrong Key)
  console.log('\n--- TEST 3: POST /api/readings with WRONG x-device-key (Expect 401) ---');
  const resAuthWrong = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-key': 'invalid_secret_key'
    },
    body: JSON.stringify(validReadingPayload)
  });
  const dataAuthWrong = await resAuthWrong.json();
  assert.strictEqual(resAuthWrong.status, 401);
  assert.strictEqual(dataAuthWrong.success, false);
  console.log('✅ TEST 3 PASSED: Wrong x-device-key header rejected with 401');

  // TEST 4: Header x-device-key Authentication Success
  console.log('\n--- TEST 4: POST /api/readings with VALID x-device-key (Expect 201) ---');
  const resAuthSuccess = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-key': 'test_secret_key_xyz'
    },
    body: JSON.stringify(validReadingPayload)
  });
  const dataAuthSuccess = await resAuthSuccess.json();
  assert.strictEqual(resAuthSuccess.status, 201);
  assert.strictEqual(dataAuthSuccess.success, true);
  assert.strictEqual(dataAuthSuccess.data.device_id, 'ESP32-WATER-01');
  console.log('✅ TEST 4 PASSED: Valid x-device-key header authenticated & saved reading');

  // TEST 5: Optional Sensor Fields (flow_lpm and water_level_percent missing -> saved as null)
  console.log('\n--- TEST 5: Ingestion with MISSING optional fields (flow_lpm, water_level_percent) ---');
  const missingOptionalPayload = {
    device_id: 'ESP32-BASIC-SENSOR',
    ph: 7.0,
    turbidity_ntu: 1.2,
    tds_ppm: 180,
    temperature_c: 22.0
  };

  const resOptional = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-key': 'test_secret_key_xyz'
    },
    body: JSON.stringify(missingOptionalPayload)
  });
  const dataOptional = await resOptional.json();
  assert.strictEqual(resOptional.status, 201);
  assert.strictEqual(dataOptional.data.flow_lpm, null);
  assert.strictEqual(dataOptional.data.water_level_percent, null);
  console.log('✅ TEST 5 PASSED: Omitted optional sensor fields successfully saved as null');

  // TEST 6: Invalid Optional Sensor Field
  console.log('\n--- TEST 6: Ingestion with INVALID non-numeric optional field ---');
  const invalidOptionalPayload = {
    device_id: 'ESP32-BAD-SENSOR',
    ph: 7.0,
    turbidity_ntu: 1.2,
    tds_ppm: 180,
    temperature_c: 22.0,
    flow_lpm: 'not-a-number'
  };

  const resInvalidOptional = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-key': 'test_secret_key_xyz'
    },
    body: JSON.stringify(invalidOptionalPayload)
  });
  const dataInvalidOptional = await resInvalidOptional.json();
  assert.strictEqual(resInvalidOptional.status, 400);
  assert.strictEqual(dataInvalidOptional.success, false);
  console.log('✅ TEST 6 PASSED: Invalid non-numeric optional field rejected with 400');

  // TEST 7: Temperature Threshold Breach Evaluation
  console.log('\n--- TEST 7: Temperature Threshold Breach (high temp > 40°C) ---');
  const tempBreachPayload = {
    device_id: 'ESP32-HOT-WATER',
    ph: 7.1,
    turbidity_ntu: 2.0,
    tds_ppm: 200,
    temperature_c: 48.5
  };

  const resTempBreach = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-key': 'test_secret_key_xyz'
    },
    body: JSON.stringify(tempBreachPayload)
  });
  const dataTempBreach = await resTempBreach.json();
  assert.strictEqual(resTempBreach.status, 201);
  const tempAlert = dataTempBreach.data.alerts.find(a => a.parameter === 'temperature_c');
  assert.ok(tempAlert);
  console.log(`✅ TEST 7 PASSED: Temperature breach produced alert: "${tempAlert.message}"`);

  // TEST 8: GET /api/health after readings ingested
  console.log('\n--- TEST 8: GET /api/health after readings ingested ---');
  const resHealth2 = await fetch(`${baseUrl}/api/health`);
  const dataHealth2 = await resHealth2.json();
  assert.strictEqual(resHealth2.status, 200);
  assert.notStrictEqual(dataHealth2.last_reading_at, null);
  console.log(`✅ TEST 8 PASSED: GET /api/health returned last_reading_at: ${dataHealth2.last_reading_at}`);

  // TEST 9: POST /api/simulate
  console.log('\n--- TEST 9: POST /api/simulate (No x-device-key required) ---');
  const resSimulate = await fetch(`${baseUrl}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: 'ESP32-DEV-SIM' })
  });
  const dataSimulate = await resSimulate.json();
  assert.strictEqual(resSimulate.status, 201);
  assert.strictEqual(dataSimulate.isSimulated, true);
  console.log('✅ TEST 9 PASSED: POST /api/simulate succeeded without x-device-key header');

  // TEST 10: GET /api/readings/latest & /history
  console.log('\n--- TEST 10: GET /api/readings/latest & /history ---');
  const resLatest = await fetch(`${baseUrl}/api/readings/latest?device_id=ESP32-HOT-WATER`);
  const dataLatest = await resLatest.json();
  assert.strictEqual(resLatest.status, 200);

  const resHistory = await fetch(`${baseUrl}/api/readings/history?device_id=ESP32-WATER-01&range=day`);
  const dataHistory = await resHistory.json();
  assert.strictEqual(resHistory.status, 200);
  console.log('✅ TEST 10 PASSED: Fetched latest reading and history records');

  // TEST 11: Verify Compound Index
  console.log('\n--- TEST 11: Verify Mongoose Compound Index { device_id: 1, timestamp: -1 } ---');
  const indexes = Reading.schema.indexes();
  const hasCompoundIndex = indexes.some(idx => idx[0].device_id === 1 && idx[0].timestamp === -1);
  assert.strictEqual(hasCompoundIndex, true);
  console.log('✅ TEST 11 PASSED: Compound index verified on Reading schema');

  // TEST 12: Verify Socket.IO Real-time Events
  console.log('\n--- TEST 12: Verify Socket.IO Broadcasts ---');
  await new Promise(r => setTimeout(r, 200));
  assert.ok(receivedSocketEvents.length >= 4);
  console.log(`✅ TEST 12 PASSED: Socket.IO client received ${receivedSocketEvents.length} live 'new_reading' events`);

  // TEST 13: DELETE /api/readings/reset Endpoint Authentication & Data Purge
  console.log('\n--- TEST 13: DELETE /api/readings/reset Endpoint & Purge ---');

  // 13a: Reject without x-device-key
  const resResetNoKey = await fetch(`${baseUrl}/api/readings/reset`, { method: 'DELETE' });
  assert.strictEqual(resResetNoKey.status, 401);
  console.log('  -> Rejected reset request without x-device-key header (401)');

  // 13b: Reject with WRONG x-device-key
  const resResetWrongKey = await fetch(`${baseUrl}/api/readings/reset`, {
    method: 'DELETE',
    headers: { 'x-device-key': 'wrong_key_abc' }
  });
  assert.strictEqual(resResetWrongKey.status, 401);
  console.log('  -> Rejected reset request with wrong x-device-key header (401)');

  // 13c: Execute with VALID x-device-key
  const countBefore = await Reading.countDocuments();
  assert.ok(countBefore > 0, 'Database should have readings before reset');

  const resResetValid = await fetch(`${baseUrl}/api/readings/reset`, {
    method: 'DELETE',
    headers: { 'x-device-key': 'test_secret_key_xyz' }
  });
  const dataResetValid = await resResetValid.json();
  assert.strictEqual(resResetValid.status, 200);
  assert.strictEqual(dataResetValid.success, true);
  assert.strictEqual(dataResetValid.deletedCount, countBefore);
  console.log(`  -> Reset endpoint returned success: true, deletedCount: ${dataResetValid.deletedCount}`);

  // 13d: Confirm collection is empty and /api/health returns null
  const countAfter = await Reading.countDocuments();
  assert.strictEqual(countAfter, 0, 'Database collection must be empty after reset');

  const resHealthPostReset = await fetch(`${baseUrl}/api/health`);
  const dataHealthPostReset = await resHealthPostReset.json();
  assert.strictEqual(dataHealthPostReset.last_reading_at, null);
  console.log('✅ TEST 13 PASSED: Reset endpoint authenticated, purged all data, and updated health status');

  // Clean up
  socketClient.disconnect();
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();

  console.log('\n🎉 ALL 13 INTEGRATION, SECURITY & RESET TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

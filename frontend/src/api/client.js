const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch health status of system
 */
export async function getHealthStatus() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return await res.json();
}

/**
 * Fetch latest telemetry reading
 * @param {String} deviceId
 */
export async function getLatestReading(deviceId) {
  const url = deviceId
    ? `${API_BASE_URL}/api/readings/latest?device_id=${encodeURIComponent(deviceId)}`
    : `${API_BASE_URL}/api/readings/latest`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch latest reading');
  }
  const json = await res.json();
  return json.data;
}

/**
 * Fetch historical readings for charting
 * @param {String} deviceId
 * @param {String} range ('hour' | 'day' | 'week')
 */
export async function getReadingHistory(deviceId, range = 'day') {
  let url = `${API_BASE_URL}/api/readings/history?range=${range}`;
  if (deviceId) {
    url += `&device_id=${encodeURIComponent(deviceId)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch reading history');
  const json = await res.json();
  return json.data || [];
}

/**
 * Fetch threshold limits
 */
export async function getThresholds() {
  const res = await fetch(`${API_BASE_URL}/api/thresholds`);
  if (!res.ok) throw new Error('Failed to fetch thresholds');
  const json = await res.json();
  return json.data;
}

/**
 * Trigger dev simulation endpoint
 * @param {String} deviceId
 */
export async function triggerSimulation(deviceId) {
  const res = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId })
  });
  if (!res.ok) throw new Error('Simulation trigger failed');
  return await res.json();
}

/**
 * Reset all telemetry readings (dev reset)
 * Sends x-device-key header
 */
export async function resetAllReadings(apiKey) {
  const deviceKey = apiKey || import.meta.env.VITE_DEVICE_API_KEY || 'test_secret_key_xyz';
  const res = await fetch(`${API_BASE_URL}/api/readings/reset`, {
    method: 'DELETE',
    headers: {
      'x-device-key': deviceKey
    }
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || 'Failed to reset readings');
  }
  return await res.json();
}

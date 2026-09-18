import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import SensorCharts from './components/SensorCharts';
import { getHealthStatus, getLatestReading, getThresholds, getReadingHistory } from './api/client';
import { getSocket } from './socket/socketClient';

const DEFAULT_DEVICE_ID = import.meta.env.VITE_DEFAULT_DEVICE_ID || 'ESP32-WATER-01';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reading, setReading] = useState(null);
  const [health, setHealth] = useState({ status: 'ok', last_reading_at: null });
  const [thresholds, setThresholds] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [chartRange, setChartRange] = useState('day');
  const [recentAlertsLog, setRecentAlertsLog] = useState([]);
  const [secondsAgo, setSecondsAgo] = useState(null);

  // 1. Initial Load (REST API calls)
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [healthRes, latestReading, thresholdsData, history] = await Promise.all([
          getHealthStatus().catch(() => ({ status: 'ok', last_reading_at: null })),
          getLatestReading(DEFAULT_DEVICE_ID).catch(() => null),
          getThresholds().catch(() => null),
          getReadingHistory(DEFAULT_DEVICE_ID, chartRange).catch(() => [])
        ]);

        if (healthRes) setHealth(healthRes);
        if (latestReading) setReading(latestReading);
        if (thresholdsData) setThresholds(thresholdsData);
        if (history) setHistoryData(history);
      } catch (err) {
        console.error('[Initial Load Error]', err);
      }
    }

    loadInitialData();
  }, []);

  // 2. Fetch History when range changes
  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await getReadingHistory(DEFAULT_DEVICE_ID, chartRange);
        setHistoryData(history || []);
      } catch (err) {
        console.error('[History Fetch Error]', err);
      }
    }
    fetchHistory();
  }, [chartRange]);

  // 3. Socket.IO Live Updates
  useEffect(() => {
    const socket = getSocket();

    const handleNewReading = (newReading) => {
      console.log('[Socket.IO] Live reading received:', newReading);

      // Update current reading state
      setReading(newReading);

      // Update health last_reading_at
      if (newReading.timestamp) {
        setHealth((prev) => ({
          ...prev,
          last_reading_at: newReading.timestamp
        }));
      }

      // Append to live chart history without full re-fetch
      setHistoryData((prevData) => {
        const exists = prevData.some((item) => item._id && item._id === newReading._id);
        if (exists) return prevData;
        const updated = [...prevData, newReading];
        // Keep reasonable max chart array length
        return updated.length > 200 ? updated.slice(updated.length - 200) : updated;
      });

      // If reading has active alerts, add to running log (max 20)
      if (newReading.alerts && newReading.alerts.length > 0) {
        const logEntries = newReading.alerts.map((a) => ({
          ...a,
          deviceId: newReading.device_id,
          timestamp: newReading.timestamp || new Date().toISOString()
        }));

        setRecentAlertsLog((prevLog) => {
          const combined = [...logEntries, ...prevLog];
          return combined.slice(0, 20);
        });
      }
    };

    socket.on('new_reading', handleNewReading);

    return () => {
      socket.off('new_reading', handleNewReading);
    };
  }, []);

  // 4. Live Ticker for Relative Time ("12s ago")
  useEffect(() => {
    const interval = setInterval(() => {
      const lastTime = reading?.timestamp || health.last_reading_at;
      if (!lastTime) {
        setSecondsAgo(null);
        return;
      }
      const diffMs = new Date() - new Date(lastTime);
      const secs = Math.max(0, Math.floor(diffMs / 1000));
      setSecondsAgo(secs);
    }, 1000);

    return () => clearInterval(interval);
  }, [reading, health.last_reading_at]);

  // Determine system online status (>30s without update = offline/stale)
  const isOnline = secondsAgo !== null && secondsAgo <= 30;

  const lastUpdatedText = secondsAgo === null
    ? 'No Data'
    : secondsAgo < 2
    ? 'Updated just now'
    : `Updated ${secondsAgo}s ago`;

  const handleResetState = () => {
    setReading(null);
    setHistoryData([]);
    setRecentAlertsLog([]);
    setHealth({ status: 'ok', last_reading_at: null });
    setSecondsAgo(null);
  };

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        lastUpdatedText={lastUpdatedText}
        deviceId={DEFAULT_DEVICE_ID}
      />

      <main className="main-content">
        {activeTab === 'dashboard' ? (
          <DashboardView
            reading={reading}
            thresholds={thresholds}
            recentAlertsLog={recentAlertsLog}
            deviceId={DEFAULT_DEVICE_ID}
            lastUpdatedText={lastUpdatedText}
            onSimulated={(newReading) => setReading(newReading)}
            onReset={handleResetState}
          />
        ) : (
          <SensorCharts
            historyData={historyData}
            range={chartRange}
            setRange={setChartRange}
            thresholds={thresholds}
            deviceId={DEFAULT_DEVICE_ID}
            onSimulated={(newReading) => setReading(newReading)}
            onReset={handleResetState}
          />
        )}
      </main>
    </div>
  );
}

import React from 'react';
import { Droplet, Waves, ShieldAlert, Thermometer, Gauge, Percent, Activity } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import AlertsPanel from '../components/AlertsPanel';
import SimulationButton from '../components/SimulationButton';
import ResetButton from '../components/ResetButton';

export default function DashboardView({
  reading,
  thresholds,
  recentAlertsLog,
  deviceId,
  lastUpdatedText,
  onSimulated,
  onReset
}) {
  if (!reading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>No Telemetry Data Available</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Waiting for IoT sensor signals or dev simulation data...
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <SimulationButton deviceId={deviceId} onSimulated={onSimulated} />
          <ResetButton onReset={onReset} />
        </div>
      </div>
    );
  }

  // Threshold breach checks
  const isPhBreach = reading.ph !== null && reading.ph !== undefined &&
    (reading.ph < (thresholds?.ph?.min || 6.5) || reading.ph > (thresholds?.ph?.max || 8.5));

  const isTurbidityBreach = reading.turbidity_ntu !== null && reading.turbidity_ntu !== undefined &&
    reading.turbidity_ntu > (thresholds?.turbidity_ntu?.max || 5.0);

  const isTdsBreach = reading.tds_ppm !== null && reading.tds_ppm !== undefined &&
    reading.tds_ppm > (thresholds?.tds_ppm?.max || 500);

  const isTempBreach = reading.temperature_c !== null && reading.temperature_c !== undefined &&
    (reading.temperature_c < (thresholds?.temperature_c?.min || 5.0) || reading.temperature_c > (thresholds?.temperature_c?.max || 40.0));

  return (
    <div>
      {/* Dev Control Bar */}
      <div className="control-bar">
        <div className="meta-info">
          <span>Device ID: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{reading.device_id || deviceId}</strong></span>
          <span>•</span>
          <span>{lastUpdatedText}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <SimulationButton deviceId={deviceId} onSimulated={onSimulated} />
          <ResetButton onReset={onReset} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="pH Level"
          value={reading.ph}
          unit="pH"
          icon={Droplet}
          rangeText={`${thresholds?.ph?.min || 6.5} – ${thresholds?.ph?.max || 8.5}`}
          isBreach={isPhBreach}
        />
        <MetricCard
          title="Turbidity"
          value={reading.turbidity_ntu}
          unit="NTU"
          icon={Waves}
          rangeText={`≤ ${thresholds?.turbidity_ntu?.max || 5.0} NTU`}
          isBreach={isTurbidityBreach}
        />
        <MetricCard
          title="Total Dissolved Solids"
          value={reading.tds_ppm}
          unit="ppm"
          icon={ShieldAlert}
          rangeText={`≤ ${thresholds?.tds_ppm?.max || 500} ppm`}
          isBreach={isTdsBreach}
        />
        <MetricCard
          title="Water Temperature"
          value={reading.temperature_c}
          unit="°C"
          icon={Thermometer}
          rangeText={`${thresholds?.temperature_c?.min || 5.0}°C – ${thresholds?.temperature_c?.max || 40.0}°C`}
          isBreach={isTempBreach}
        />
        <MetricCard
          title="Flow Rate"
          value={reading.flow_lpm}
          unit="L/min"
          icon={Gauge}
          isOptional={true}
        />
        <MetricCard
          title="Tank Water Level"
          value={reading.water_level_percent}
          unit="%"
          icon={Percent}
          isOptional={true}
        />
        <MetricCard
          title="Purification Status"
          value={reading.purification_status ? reading.purification_status.toUpperCase() : 'ACTIVE'}
          unit=""
          icon={Activity}
        />
      </div>

      {/* Alerts Panel */}
      <AlertsPanel
        activeAlerts={reading.alerts || []}
        recentAlertsLog={recentAlertsLog}
      />
    </div>
  );
}

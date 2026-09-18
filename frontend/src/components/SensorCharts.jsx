import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import SimulationButton from './SimulationButton';
import ResetButton from './ResetButton';

export default function SensorCharts({
  historyData = [],
  range = 'day',
  setRange,
  thresholds,
  deviceId,
  onSimulated,
  onReset
}) {
  // Format data timestamps with seconds precision so points in the same minute do not overlap
  const formattedData = historyData.map(item => {
    const d = new Date(item.timestamp);
    let timeFormatted = '';
    if (range === 'hour') {
      timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else if (range === 'day') {
      timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else {
      timeFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return {
      ...item,
      timeFormatted
    };
  });

  const chartConfigs = [
    {
      key: 'ph',
      title: 'pH Level',
      color: '#ec4899',
      unit: 'pH',
      minRef: thresholds?.ph?.min || 6.5,
      maxRef: thresholds?.ph?.max || 8.5
    },
    {
      key: 'turbidity_ntu',
      title: 'Turbidity',
      color: '#38bdf8',
      unit: 'NTU',
      maxRef: thresholds?.turbidity_ntu?.max || 5.0
    },
    {
      key: 'tds_ppm',
      title: 'Total Dissolved Solids (TDS)',
      color: '#a855f7',
      unit: 'ppm',
      maxRef: thresholds?.tds_ppm?.max || 500
    },
    {
      key: 'temperature_c',
      title: 'Water Temperature',
      color: '#f97316',
      unit: '°C',
      minRef: thresholds?.temperature_c?.min || 5.0,
      maxRef: thresholds?.temperature_c?.max || 40.0
    }
  ];

  return (
    <div className="charts-container">
      {/* Range Filter & Dev Simulation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-card)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Live & Historical Telemetry Charts</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Real-time streaming trends & historical time-series analytics ({formattedData.length} Data Points)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="range-selector">
            {['hour', 'day', 'week'].map((r) => (
              <button
                key={r}
                className={`range-btn ${range === r ? 'active' : ''}`}
                onClick={() => setRange(r)}
              >
                Past {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SimulationButton deviceId={deviceId} onSimulated={onSimulated} />
            <ResetButton onReset={onReset} />
          </div>
        </div>
      </div>

      {/* Grid of Charts */}
      {chartConfigs.map((cfg) => (
        <div key={cfg.key} className="chart-card">
          <div className="chart-header">
            <h4 className="chart-title" style={{ color: cfg.color }}>
              {cfg.title}
            </h4>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Unit: {cfg.unit}
            </span>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            {formattedData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No telemetry data available for range ({range})
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="timeFormatted" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(val) => [`${val} ${cfg.unit}`, cfg.title]}
                  />
                  {cfg.minRef !== undefined && (
                    <ReferenceLine y={cfg.minRef} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: `Min (${cfg.minRef})`, fill: '#f43f5e', fontSize: 10 }} />
                  )}
                  {cfg.maxRef !== undefined && (
                    <ReferenceLine y={cfg.maxRef} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: `Max (${cfg.maxRef})`, fill: '#f43f5e', fontSize: 10 }} />
                  )}
                  <Line
                    type="monotone"
                    dataKey={cfg.key}
                    stroke={cfg.color}
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: cfg.color }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

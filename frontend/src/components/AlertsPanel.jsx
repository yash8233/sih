import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export default function AlertsPanel({ activeAlerts = [], recentAlertsLog = [] }) {
  const getParamLabel = (param) => {
    switch (param) {
      case 'ph': return 'pH';
      case 'turbidity_ntu': return 'Turbidity';
      case 'tds_ppm': return 'TDS';
      case 'temperature_c': return 'Temperature';
      default: return param;
    }
  };

  return (
    <div className="alerts-card">
      <div className="alerts-header">
        <h3 className="alerts-title">
          <AlertCircle size={20} style={{ color: activeAlerts.length > 0 ? '#f87171' : '#34d399' }} />
          Water Safety Alerts
        </h3>
        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {activeAlerts.length} Active Breach{activeAlerts.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Active Reading Alerts */}
      {activeAlerts.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} />
          All water parameters are within safe WHO / BIS health standards.
        </div>
      ) : (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f87171', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Current Reading Warnings
          </div>
          {activeAlerts.map((alert, idx) => (
            <div key={idx} className={`alert-item ${alert.parameter}`}>
              <div className="alert-content">
                <span className="mono" style={{ fontWeight: '700', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                  {getParamLabel(alert.parameter)}
                </span>
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Log of Alerts */}
      {recentAlertsLog.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Recent Incident Log (Last 20)
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {recentAlertsLog.map((logItem, idx) => (
              <div key={idx} className={`alert-item ${logItem.parameter}`} style={{ opacity: 0.85, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
                <div className="alert-content">
                  <span className="mono" style={{ fontWeight: '700', fontSize: '0.7rem' }}>
                    [{logItem.deviceId || 'IoT'}]
                  </span>
                  <span>{logItem.message}</span>
                </div>
                <span className="alert-time">
                  {new Date(logItem.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

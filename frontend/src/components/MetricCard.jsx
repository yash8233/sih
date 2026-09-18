import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MetricCard({ title, value, unit, icon: Icon, rangeText, isBreach, isOptional = false }) {
  const isValueNull = value === null || value === undefined;

  return (
    <div className={`metric-card ${isBreach ? 'breach' : ''}`}>
      <div className="metric-header">
        <div className="metric-title-group">
          {Icon && <Icon size={18} style={{ color: isBreach ? '#f87171' : 'var(--color-brand-light)' }} />}
          <span>{title}</span>
        </div>
        {isBreach && (
          <span className="breach-pill">
            <AlertTriangle size={10} style={{ marginRight: '3px' }} />
            Breach
          </span>
        )}
      </div>

      <div className="metric-value-container">
        <span className="metric-value">
          {isValueNull ? (isOptional ? 'No Sensor' : '—') : value}
        </span>
        {!isValueNull && <span className="metric-unit">{unit}</span>}
      </div>

      {rangeText && (
        <div className="metric-range">
          Safe Limit: {rangeText}
        </div>
      )}
    </div>
  );
}

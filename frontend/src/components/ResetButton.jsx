import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { resetAllReadings } from '../api/client';

export default function ResetButton({ onReset }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all telemetry data?\nThis will clear all stored IoT readings from the collection.'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await resetAllReadings();
      if (onReset) onReset();
    } catch (err) {
      console.error('[Reset Error]', err);
      alert(`Failed to reset data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-reset"
      onClick={handleReset}
      disabled={loading}
      title="Clear all stored telemetry readings for demo reset"
      style={{
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '0.625rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: '700',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.15s ease'
      }}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Resetting...
        </>
      ) : (
        <>
          <Trash2 size={16} />
          Reset Demo Data
        </>
      )}
    </button>
  );
}

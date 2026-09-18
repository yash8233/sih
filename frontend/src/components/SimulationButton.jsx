import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { triggerSimulation } from '../api/client';

export default function SimulationButton({ deviceId, onSimulated }) {
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const result = await triggerSimulation(deviceId);
      if (onSimulated) onSimulated(result.data);
    } catch (err) {
      console.error('[Simulation Error]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-simulate"
      onClick={handleSimulate}
      disabled={loading}
      title="Generate and broadcast a realistic simulated IoT reading"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Generating Reading...
        </>
      ) : (
        <>
          <Play size={16} fill="currentColor" />
          ⚡ Simulate Reading (Dev Demo)
        </>
      )}
    </button>
  );
}

import React from 'react';
import { Droplets, Activity, BarChart2, Radio } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isOnline, lastUpdatedText, deviceId }) {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon">
            <Droplets size={24} />
          </div>
          <div>
            <h1 className="brand-title">AquaPulse IoT</h1>
            <p className="brand-subtitle">Real-time Rural Water Quality Monitoring ({deviceId})</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={16} />
            Live Dashboard
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            <BarChart2 size={16} />
            Sensors & Charts
          </button>
        </div>

        {/* System Health Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
            <span className="pulse-dot"></span>
            {isOnline ? 'System Online' : 'System Offline'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Radio size={12} />
            {lastUpdatedText}
          </div>
        </div>
      </div>
    </header>
  );
}

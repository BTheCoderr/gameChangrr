import React from 'react';
import './MapControls.css';

const MapControls = ({ onTogglePanel, activePanel }) => {
  const handlePanelToggle = (panelName) => {
    console.log('Button clicked:', panelName);
    console.log('Current activePanel:', activePanel);
    onTogglePanel(panelName);
  };

  return (
    <div className="map-controls">
      <div className="controls-left">
        <button 
          className={`control-button ${activePanel === 'layers' ? 'active' : ''}`}
          onClick={() => handlePanelToggle('layers')}
        >
          <span className="icon">📍</span> Layers
        </button>
        <button 
          className={`control-button ${activePanel === 'leads' ? 'active' : ''}`}
          onClick={() => handlePanelToggle('leads')}
        >
          <span className="icon">👥</span> Leads
        </button>
        <button 
          className={`control-button ${activePanel === 'filters' ? 'active' : ''}`}
          onClick={() => handlePanelToggle('filters')}
        >
          <span className="icon">🔍</span> Filters
        </button>
        <button 
          className={`control-button ${activePanel === 'solar-permits' ? 'active' : ''}`}
          onClick={() => handlePanelToggle('solar-permits')}
        >
          <span className="icon">☀️</span> Solar Permits
        </button>
      </div>
    </div>
  );
};

export default MapControls; 
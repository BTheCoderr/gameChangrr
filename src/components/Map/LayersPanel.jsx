import React from 'react';
import './LayersPanel.css';

const LayersPanel = ({ visible, activeLayers, onLayerToggle, onClose, className }) => {
  const layers = [
    { key: 'leads', label: 'Leads', icon: '👥' },
    { key: 'houses', label: 'Houses', icon: '🏠' },
    { key: 'neighborhoodInsights', label: 'Neighborhood Insights', icon: '📊' },
    { key: 'utilityBoundaries', label: 'Utility Boundaries', icon: '🏢' },
    { key: 'solarPermits', label: 'Solar Permits', icon: '☀️' },
    { key: 'roofPermits', label: 'Roof Permits', icon: '🏠' },
    { key: 'hvacPermits', label: 'HVAC Permits', icon: '❄️' },
    { key: 'poolPermits', label: 'Pool Permits', icon: '🏊' },
    { key: 'moveIns', label: 'Move Ins', icon: '📦' },
    { key: 'cityBoundaries', label: 'City Boundaries', icon: '🏛️' },
    { key: 'solarPotentialAI', label: 'Solar Potential AI', icon: '⚡' },
    { key: 'manufacturedHomes', label: 'Manufactured Homes', icon: '🏘️' },
    { key: 'hoas', label: 'HOAs', icon: '👥' },
    { key: 'spanishSpeakers', label: 'Spanish Speakers', icon: '🗣️' },
    { key: 'zipcodeStats', label: 'Zipcode Stats', icon: '📊' },
    { key: 'sgip', label: 'SGIP', icon: '📱' },
    { key: 'adRespondents', label: 'Ad Respondents', icon: '📢' },
    { key: 'evOwners', label: 'EV Owners', icon: '🚗' },
    { key: 'reapIneligibleAreas', label: 'REAP Ineligible Areas', icon: '🚫' },
    { key: 'powerOutages', label: 'Power Outages', icon: '⚡' }
  ];

  return (
    <div className={className}>
      <div className="panel-header">
        <h3>Layers</h3>
        <button className="panel-close" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="layer-grid">
          {layers.map(layer => (
            <div key={layer.key} className="layer-item">
              <label className="layer-toggle">
                <input
                  type="checkbox"
                  checked={activeLayers[layer.key] || false}
                  onChange={() => onLayerToggle(layer.key)}
                />
                <span className="layer-icon">{layer.icon}</span>
                <span className="layer-label">{layer.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayersPanel; 
import React from 'react';
import './LayersPanel.css';

const LayersPanel = ({ visible, activeLayers, onLayerToggle, onClose }) => {
  const layerGroups = [
    {
      title: 'Base Layers',
      layers: [
        { key: 'utilityBoundaries', label: 'Utility Boundaries', icon: '🏢' },
        { key: 'cityBoundaries', label: 'City Boundaries', icon: '🏛️' },
        { key: 'neighborhoodInsights', label: 'Neighborhood Insights', icon: '📊' }
      ]
    },
    {
      title: 'Permits & Installations',
      layers: [
        { key: 'solarPermits', label: 'Solar Permits', icon: '☀️' },
        { key: 'roofPermits', label: 'Roof Permits', icon: '🏠' },
        { key: 'hvacPermits', label: 'HVAC Permits', icon: '❄️' },
        { key: 'poolPermits', label: 'Pool Permits', icon: '🏊' }
      ]
    },
    {
      title: 'Property Data',
      layers: [
        { key: 'moveIns', label: 'Move Ins', icon: '📦' },
        { key: 'solarPotential', label: 'Solar Potential', icon: '⚡' },
        { key: 'manufacturedHomes', label: 'Manufactured Homes', icon: '🏘️' },
        { key: 'hoas', label: 'HOAs', icon: '👥' }
      ]
    },
    {
      title: 'Demographics',
      layers: [
        { key: 'spanishSpeakers', label: 'Spanish Speakers', icon: '🗣️' },
        { key: 'zipcodeStats', label: 'Zipcode Stats', icon: '📊' },
        { key: 'evOwners', label: 'EV Owners', icon: '🚗' }
      ]
    },
    {
      title: 'Programs & Incentives',
      layers: [
        { key: 'sgip', label: 'SGIP', icon: '📱' },
        { key: 'reapIneligibleAreas', label: 'REAP Ineligible Areas', icon: '🚫' }
      ]
    },
    {
      title: 'Marketing & Leads',
      layers: [
        { key: 'leads', label: 'Leads', icon: '👥' },
        { key: 'adRespondents', label: 'Ad Respondents', icon: '📢' }
      ]
    },
    {
      title: 'Infrastructure',
      layers: [
        { key: 'evStations', label: 'EV Stations', icon: '🔌' },
        { key: 'powerOutages', label: 'Power Outages', icon: '⚡' }
      ]
    }
  ];

  // State for layer opacities
  const [layerOpacities, setLayerOpacities] = React.useState({});

  // Handle opacity change
  const handleOpacityChange = (layerKey, value) => {
    setLayerOpacities(prev => ({
      ...prev,
      [layerKey]: value
    }));
    // Notify parent component about opacity change
    if (onLayerToggle) {
      onLayerToggle(layerKey, { opacity: value });
    }
  };

  return (
    <div className="layer-groups">
      {layerGroups.map(group => (
        <div key={group.title} className="layer-group">
          <h4 className="group-title">{group.title}</h4>
          <div className="layer-grid">
            {group.layers.map(layer => (
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
                {activeLayers[layer.key] && (
                  <div className="layer-opacity">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layerOpacities[layer.key] || 1}
                      onChange={(e) => handleOpacityChange(layer.key, parseFloat(e.target.value))}
                      className="opacity-slider"
                    />
                    <span className="opacity-value">{Math.round((layerOpacities[layer.key] || 1) * 100)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LayersPanel; 
import React from 'react';
import './LayerPanel.css';

const LAYER_GROUPS = [
  {
    title: 'Base Layers',
    layers: [
      { id: 'utilityBoundaries', label: 'Utility Boundaries', icon: '⚡', hasOpacity: true },
      { id: 'cityBoundaries', label: 'City Boundaries', icon: '🏛️', hasOpacity: true },
      { id: 'neighborhoodInsights', label: 'Neighborhood Insights', icon: '📊', hasOpacity: true }
    ]
  },
  {
    title: 'Solar & Energy',
    layers: [
      { id: 'solarPermits', label: 'Solar Permits', icon: '☀️', hasOpacity: true },
      { id: 'solarPotential', label: 'Solar Potential', icon: '⚡', hasOpacity: true },
      { id: 'evStations', label: 'EV Stations', icon: '🔌', hasOpacity: true }
    ]
  },
  {
    title: 'Property Data',
    layers: [
      { id: 'moveIns', label: 'Move Ins', icon: '📦', hasOpacity: true },
      { id: 'propertyValues', label: 'Property Values', icon: '💰', hasOpacity: true },
      { id: 'hoas', label: 'HOAs', icon: '👥', hasOpacity: true }
    ]
  },
  {
    title: 'Demographics',
    layers: [
      { id: 'incomeData', label: 'Income Data', icon: '💵', hasOpacity: true },
      { id: 'populationDensity', label: 'Population Density', icon: '👥', hasOpacity: true },
      { id: 'evOwners', label: 'EV Owners', icon: '🚗', hasOpacity: true }
    ]
  }
];

const DEFAULT_OPACITY = 1;

const LayerPanel = ({ layers, onLayerChange, onOpacityChange }) => {
  const [expandedGroups, setExpandedGroups] = React.useState(
    LAYER_GROUPS.reduce((acc, group) => ({ ...acc, [group.title]: true }), {})
  );

  const toggleGroup = (title) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLayerToggle = (layerId) => {
    onLayerChange(layerId, !layers[layerId]?.visible);
  };

  const handleOpacityChange = (layerId, opacity) => {
    onOpacityChange(layerId, opacity);
  };

  const handleResetAll = () => {
    // Reset all layer visibility and opacity
    LAYER_GROUPS.forEach(group => {
      group.layers.forEach(layer => {
        onLayerChange(layer.id, false);
        onOpacityChange(layer.id, DEFAULT_OPACITY);
      });
    });
    // Expand all groups
    setExpandedGroups(
      LAYER_GROUPS.reduce((acc, group) => ({ ...acc, [group.title]: true }), {})
    );
  };

  const handleToggleAll = (groupTitle, visible) => {
    const group = LAYER_GROUPS.find(g => g.title === groupTitle);
    if (group) {
      group.layers.forEach(layer => {
        onLayerChange(layer.id, visible);
      });
    }
  };

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <div className="header-title">
          <h3>Map Layers</h3>
          <button className="reset-button" onClick={handleResetAll}>
            Reset All
          </button>
        </div>
        <p className="header-description">Toggle layers and adjust their opacity</p>
      </div>
      
      {LAYER_GROUPS.map(group => (
        <div key={group.title} className="layer-group">
          <div className="layer-group-header">
            <div className="group-title" onClick={() => toggleGroup(group.title)}>
              <h4>{group.title}</h4>
              <span className={`expand-icon ${expandedGroups[group.title] ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
            <div className="group-actions">
              <button 
                className="toggle-all-button"
                onClick={() => handleToggleAll(group.title, true)}
              >
                Show All
              </button>
              <button 
                className="toggle-all-button"
                onClick={() => handleToggleAll(group.title, false)}
              >
                Hide All
              </button>
            </div>
          </div>
          
          {expandedGroups[group.title] && (
            <div className="layer-items">
              {group.layers.map(layer => (
                <div key={layer.id} className="layer-item">
                  <div className="layer-item-header">
                    <label className="layer-toggle">
                      <input
                        type="checkbox"
                        checked={layers[layer.id]?.visible || false}
                        onChange={() => handleLayerToggle(layer.id)}
                      />
                      <span className="layer-icon">{layer.icon}</span>
                      <span className="layer-label">{layer.label}</span>
                    </label>
                  </div>
                  
                  {layers[layer.id]?.visible && layer.hasOpacity && (
                    <div className="layer-opacity">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layers[layer.id]?.opacity || DEFAULT_OPACITY}
                        onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                        className="opacity-slider"
                      />
                      <span className="opacity-value">
                        {Math.round((layers[layer.id]?.opacity || DEFAULT_OPACITY) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LayerPanel; 
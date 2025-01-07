import React, { useState } from 'react';
import { LAYER_STYLES, LEGEND_CONFIG } from '../../config/mapStyles';
import './LayerPanel.css';

const LayerPanel = ({ layers, onLayerChange, onOpacityChange }) => {
  const [expandedGroups, setExpandedGroups] = useState(['base', 'permits', 'analysis']);

  const layerGroups = {
    base: {
      title: 'Base Layers',
      description: 'Administrative and utility boundaries',
      layers: ['utilityBoundaries', 'cityBoundaries']
    },
    permits: {
      title: 'Permits & Installations',
      description: 'Building permits and solar installations',
      layers: ['solarPermits', 'roofPermits', 'hvacPermits', 'poolPermits']
    },
    analysis: {
      title: 'Analysis',
      description: 'Solar potential and demographic data',
      layers: ['solarPotential', 'demographicsChoropleth', 'evStationsHeatmap']
    }
  };

  const layerInfo = {
    utilityBoundaries: {
      label: 'Utility Boundaries',
      icon: '🏢',
      description: 'Service territories of utility companies',
      hasOpacityControl: true
    },
    cityBoundaries: {
      label: 'City Boundaries',
      icon: '🏛️',
      description: 'Municipal boundaries and districts',
      hasOpacityControl: true
    },
    solarPermits: {
      label: 'Solar Permits',
      icon: '☀️',
      description: 'Active and historical solar installations',
      hasOpacityControl: false
    },
    roofPermits: {
      label: 'Roof Permits',
      icon: '🏠',
      description: 'Roof repair and replacement permits',
      hasOpacityControl: false
    },
    hvacPermits: {
      label: 'HVAC Permits',
      icon: '❄️',
      description: 'HVAC installation and service permits',
      hasOpacityControl: false
    },
    poolPermits: {
      label: 'Pool Permits',
      icon: '🏊',
      description: 'Swimming pool installation permits',
      hasOpacityControl: false
    },
    solarPotential: {
      label: 'Solar Potential',
      icon: '🌞',
      description: 'Areas with high solar energy generation potential',
      hasOpacityControl: true
    },
    demographicsChoropleth: {
      label: 'Demographics',
      icon: '📊',
      description: 'Population and demographic statistics',
      hasOpacityControl: true
    },
    evStationsHeatmap: {
      label: 'EV Stations',
      icon: '🚗',
      description: 'Electric vehicle charging station density',
      hasOpacityControl: true
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleOpacityChange = (layerId, value) => {
    onOpacityChange(layerId, parseFloat(value));
  };

  const toggleAllLayers = (groupId, visible) => {
    layerGroups[groupId].layers.forEach(layerId => {
      onLayerChange(layerId, visible);
    });
  };

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Map Layers</h3>
        <button 
          className="toggle-all-button"
          onClick={() => {
            const allVisible = Object.values(layers).every(layer => layer.visible);
            Object.keys(layers).forEach(id => onLayerChange(id, !allVisible));
          }}
        >
          {Object.values(layers).every(layer => layer.visible) ? 'Hide All' : 'Show All'}
        </button>
      </div>

      {Object.entries(layerGroups).map(([groupId, group]) => (
        <div key={groupId} className="layer-group">
          <div 
            className="layer-group-header"
            onClick={() => toggleGroup(groupId)}
          >
            <h4>{group.title}</h4>
            <div className="group-controls">
              <button
                className="toggle-group-button"
                onClick={(e) => {
                  e.stopPropagation();
                  const groupVisible = group.layers.every(id => layers[id]?.visible);
                  toggleAllLayers(groupId, !groupVisible);
                }}
              >
                {group.layers.every(id => layers[id]?.visible) ? 'Hide All' : 'Show All'}
              </button>
              <span className={`expand-icon ${expandedGroups.includes(groupId) ? 'expanded' : ''}`}>
                ▼
              </span>
            </div>
          </div>
          
          {expandedGroups.includes(groupId) && (
            <>
              <p className="group-description">{group.description}</p>
              {group.layers.map(layerId => {
                const layer = layers[layerId];
                const info = layerInfo[layerId];
                
                if (!layer || !info) return null;

                return (
                  <div key={layerId} className="layer-item">
                    <div className="layer-item-header">
                      <label className="layer-toggle">
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          onChange={(e) => onLayerChange(layerId, e.target.checked)}
                        />
                        <span className="layer-icon">{info.icon}</span>
                        <span className="layer-label">{info.label}</span>
                      </label>
                      <div className="layer-tooltip" title={info.description}>ℹ️</div>
                    </div>
                    {layer.visible && info.hasOpacityControl && (
                      <div className="layer-opacity">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer.opacity}
                          onChange={(e) => handleOpacityChange(layerId, e.target.value)}
                          className="opacity-slider"
                        />
                        <span className="opacity-value">{Math.round(layer.opacity * 100)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      ))}

      {/* Legend Section */}
      <div className="layer-panel-legend">
        <h4>Legend</h4>
        {Object.entries(LEGEND_CONFIG).map(([type, config]) => {
          const visibleInType = Object.entries(layers)
            .filter(([id, layer]) => layer.visible && layerInfo[id]?.type === type)
            .length > 0;

          if (!visibleInType) return null;

          return (
            <div key={type} className="legend-section">
              <h5>{config.title}</h5>
              <div className="legend-items">
                {config.items.map((item, index) => (
                  <div key={index} className="legend-item">
                    {item.color && (
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    {item.size && (
                      <span 
                        className="legend-circle" 
                        style={{ 
                          width: item.size, 
                          height: item.size,
                          backgroundColor: item.color 
                        }}
                      />
                    )}
                    <span className="legend-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LayerPanel; 
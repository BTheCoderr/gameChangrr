import React from 'react';
import './LayerPanel.css';

const LAYERS_WITH_OPACITY = {
  utilityBoundaries: true,
  cityBoundaries: true,
  solarPotential: true,
  demographicsChoropleth: true,
  solarPermits: true,
  evStationsHeatmap: true
};

const LayerPanel = ({ layers, onLayerChange, onOpacityChange }) => {
  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <h3>Map Layers</h3>
      </div>
      
      {Object.entries(layers).map(([layerId, settings]) => (
        <div key={layerId} className="layer-item">
          <div className="layer-item-header">
            <label className="layer-toggle">
              <input
                type="checkbox"
                checked={settings.visible}
                onChange={(e) => onLayerChange(layerId, e.target.checked)}
              />
              <span className="layer-label">
                {layerId.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          </div>
          
          {settings.visible && LAYERS_WITH_OPACITY[layerId] && (
            <div className="layer-opacity">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.opacity}
                onChange={(e) => onOpacityChange(layerId, parseFloat(e.target.value))}
                className="opacity-slider"
              />
              <span className="opacity-value">
                {Math.round(settings.opacity * 100)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LayerPanel; 
import React from 'react';
import './MapLegend.css';
import { MA_UTILITIES } from '../../services/utilityService';

const MapLegend = ({ activeLayers }) => {
  const utilityEntries = Object.values(MA_UTILITIES).map(utility => ({
    name: utility.name,
    color: utility.color,
    borderColor: utility.borderColor
  }));

  return (
    <div className="map-legend">
      <h3>Map Legend</h3>
      
      {/* Utility Boundaries */}
      {activeLayers.utilityBoundaries && (
        <div className="legend-section">
          <h4>Utility Service Areas</h4>
          <div className="legend-items">
            {utilityEntries.map((utility, index) => (
              <div key={index} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ 
                    backgroundColor: utility.color,
                    border: `2px solid ${utility.borderColor}`
                  }}
                />
                <span className="legend-label">{utility.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* City Boundaries */}
      {activeLayers.cityBoundaries && (
        <div className="legend-section">
          <h4>City Boundaries</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span 
                className="legend-color" 
                style={{ 
                  backgroundColor: 'rgba(66, 133, 244, 0.2)',
                  border: '2px solid #4285F4'
                }}
              />
              <span className="legend-label">City Territory</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-color" 
                style={{ 
                  backgroundColor: 'rgba(251, 188, 4, 0.3)',
                  border: '2px solid #FBBC04'
                }}
              />
              <span className="legend-label">Selected City</span>
            </div>
          </div>
        </div>
      )}

      {/* Solar Permits */}
      {activeLayers.solarPermits && (
        <div className="legend-section">
          <h4>Solar Permits</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span 
                className="legend-circle" 
                style={{ 
                  backgroundColor: '#4CAF50',
                  border: '2px solid #388E3C'
                }}
              />
              <span className="legend-label">Active</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-circle" 
                style={{ 
                  backgroundColor: '#FFC107',
                  border: '2px solid #FFA000'
                }}
              />
              <span className="legend-label">Expired</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-circle" 
                style={{ 
                  backgroundColor: '#F44336',
                  border: '2px solid #D32F2F'
                }}
              />
              <span className="legend-label">Bankrupt</span>
            </div>
            <div className="legend-item cluster">
              <span 
                className="legend-circle" 
                style={{ 
                  backgroundColor: '#2196F3',
                  border: '2px solid #1976D2'
                }}
              />
              <span className="legend-label">Permit Cluster</span>
            </div>
          </div>
        </div>
      )}

      {/* Solar Potential */}
      {activeLayers.solarPotential && (
        <div className="legend-section">
          <h4>Solar Potential</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span 
                className="legend-rect" 
                style={{ backgroundColor: '#92400E' }}
              />
              <span className="legend-label">Very High</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-rect" 
                style={{ backgroundColor: '#D97706' }}
              />
              <span className="legend-label">High</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-rect" 
                style={{ backgroundColor: '#F59E0B' }}
              />
              <span className="legend-label">Medium</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-rect" 
                style={{ backgroundColor: '#FCD34D' }}
              />
              <span className="legend-label">Low</span>
            </div>
            <div className="legend-item">
              <span 
                className="legend-rect" 
                style={{ backgroundColor: '#FEF3C7' }}
              />
              <span className="legend-label">Very Low</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend; 
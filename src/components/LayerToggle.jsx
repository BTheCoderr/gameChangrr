import React from 'react';
import './LayerToggle.css';

const LayerToggle = ({ layerName, isActive, onToggle, label }) => {
  const handleClick = () => {
    console.log('Layer toggle clicked:', layerName, 'Current state:', isActive);
    onToggle(layerName);
  };

  return (
    <div className="layer-toggle" onClick={handleClick}>
      <div className={`toggle-switch ${isActive ? 'active' : ''}`}>
        <div className="toggle-circle" />
      </div>
      <span className="layer-label">{label || layerName}</span>
    </div>
  );
};

export default LayerToggle; 
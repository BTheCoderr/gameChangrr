import React from 'react';
import './SolarPermitsPanel.css';

const SolarPermitsPanel = ({ visible, filters, onFiltersChange, onClose, className }) => {
  const handleDateRangeChange = (value, index) => {
    const newRange = [...filters.dateRange];
    newRange[index] = value;
    onFiltersChange({ ...filters, dateRange: newRange });
  };

  const handleCapacityRangeChange = (value, index) => {
    const newRange = [...filters.capacityRange];
    newRange[index] = parseInt(value);
    onFiltersChange({ ...filters, capacityRange: newRange });
  };

  return (
    <div className={className}>
      <div className="panel-header">
        <h3>Solar Permits</h3>
        <button className="panel-close" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="filter-group">
          <h4>Filter by permit date range</h4>
          <div className="date-inputs">
            <input
              type="date"
              value={filters.dateRange[0]}
              onChange={(e) => handleDateRangeChange(e.target.value, 0)}
            />
            <span>to</span>
            <input
              type="date"
              value={filters.dateRange[1]}
              onChange={(e) => handleDateRangeChange(e.target.value, 1)}
            />
          </div>
        </div>

        <div className="filter-group">
          <h4>System Capacity (kW)</h4>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="50"
              value={filters.capacityRange[0]}
              onChange={(e) => handleCapacityRangeChange(e.target.value, 0)}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="50"
              value={filters.capacityRange[1]}
              onChange={(e) => handleCapacityRangeChange(e.target.value, 1)}
            />
          </div>
        </div>

        <div className="filter-group">
          <h4>Permit Features</h4>
          <div className="permit-features">
            <label className="feature-checkbox">
              <input
                type="checkbox"
                checked={filters.expiredPermits}
                onChange={(e) => onFiltersChange({ ...filters, expiredPermits: e.target.checked })}
              />
              Expired permits
            </label>
            <label className="feature-checkbox">
              <input
                type="checkbox"
                checked={filters.recentPermits}
                onChange={(e) => onFiltersChange({ ...filters, recentPermits: e.target.checked })}
              />
              Recent permits (30 - 60 days old)
            </label>
            <label className="feature-checkbox">
              <input
                type="checkbox"
                checked={filters.hasBattery}
                onChange={(e) => onFiltersChange({ ...filters, hasBattery: e.target.checked })}
              />
              Has a battery
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPermitsPanel; 
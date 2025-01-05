import React from 'react';
import './SolarPermitsPanel.css';

const SolarPermitsPanel = ({ visible, filters, onFiltersChange, onClose }) => {
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

  const handleInstallerChange = (installer, checked) => {
    onFiltersChange({
      ...filters,
      installers: {
        ...filters.installers,
        [installer]: checked
      }
    });
  };

  return (
    <>
      <div className="filter-group">
        <h4>Filter by permit date range</h4>
        <div className="date-inputs">
          <input
            type="date"
            value={filters.dateRange[0] || ''}
            onChange={(e) => handleDateRangeChange(e.target.value, 0)}
          />
          <span>to</span>
          <input
            type="date"
            value={filters.dateRange[1] || ''}
            onChange={(e) => handleDateRangeChange(e.target.value, 1)}
          />
        </div>
      </div>

      <div className="filter-group">
        <h4>Highlight by permit feature</h4>
        <div className="permit-features">
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.expiredPermits || false}
              onChange={(e) => onFiltersChange({ ...filters, expiredPermits: e.target.checked })}
            />
            Expired permits
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.recentPermits || false}
              onChange={(e) => onFiltersChange({ ...filters, recentPermits: e.target.checked })}
            />
            Recent permits (30 - 60 days old)
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.hasBattery || false}
              onChange={(e) => onFiltersChange({ ...filters, hasBattery: e.target.checked })}
            />
            Has a battery
          </label>
        </div>
      </div>

      <div className="filter-group">
        <h4>Highlight by installer</h4>
        <div className="permit-features">
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.installers?.allBankrupt || false}
              onChange={(e) => handleInstallerChange('allBankrupt', e.target.checked)}
            />
            All bankrupt installers
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.installers?.expiredBankrupt || false}
              onChange={(e) => handleInstallerChange('expiredBankrupt', e.target.checked)}
            />
            Expired permits from bankrupt installers
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.installers?.lumio || false}
              onChange={(e) => handleInstallerChange('lumio', e.target.checked)}
            />
            Lumio
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.installers?.titanSolar || false}
              onChange={(e) => handleInstallerChange('titanSolar', e.target.checked)}
            />
            Titan Solar Power
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.installers?.sunpower || false}
              onChange={(e) => handleInstallerChange('sunpower', e.target.checked)}
            />
            Sunpower
          </label>
        </div>
      </div>

      <div className="filter-group">
        <h4>System Capacity (kW)</h4>
        <div className="range-inputs">
          <input
            type="number"
            min="0"
            max="50"
            value={filters.capacityRange[0] || 0}
            onChange={(e) => handleCapacityRangeChange(e.target.value, 0)}
          />
          <span>to</span>
          <input
            type="number"
            min="0"
            max="50"
            value={filters.capacityRange[1] || 50}
            onChange={(e) => handleCapacityRangeChange(e.target.value, 1)}
          />
        </div>
      </div>
    </>
  );
};

export default SolarPermitsPanel; 
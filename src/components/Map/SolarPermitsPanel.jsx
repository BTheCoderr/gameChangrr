import React from 'react';
import './SolarPermitsPanel.css';

const SolarPermitsPanel = ({ filters, onFiltersChange }) => {
  const handleDateRangeChange = (value, index) => {
    const newRange = [...filters.solarPermits.dateRange];
    newRange[index] = value;
    onFiltersChange({
      ...filters,
      solarPermits: {
        ...filters.solarPermits,
        dateRange: newRange
      }
    });
  };

  const handleCapacityRangeChange = (value, index) => {
    const newRange = [...filters.solarPermits.capacityRange];
    newRange[index] = parseInt(value);
    onFiltersChange({
      ...filters,
      solarPermits: {
        ...filters.solarPermits,
        capacityRange: newRange
      }
    });
  };

  const handleInstallerChange = (installer, checked) => {
    onFiltersChange({
      ...filters,
      solarPermits: {
        ...filters.solarPermits,
        installers: {
          ...filters.solarPermits.installers,
          [installer]: checked
        }
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
            value={filters.solarPermits.dateRange[0] || ''}
            onChange={(e) => handleDateRangeChange(e.target.value, 0)}
          />
          <span>to</span>
          <input
            type="date"
            value={filters.solarPermits.dateRange[1] || ''}
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
            value={filters.solarPermits.capacityRange[0] || 0}
            onChange={(e) => handleCapacityRangeChange(e.target.value, 0)}
          />
          <span>to</span>
          <input
            type="number"
            min="0"
            max="50"
            value={filters.solarPermits.capacityRange[1] || 50}
            onChange={(e) => handleCapacityRangeChange(e.target.value, 1)}
          />
        </div>
      </div>

      <div className="filter-group">
        <h4>Status</h4>
        <select
          value={filters.solarPermits.status}
          onChange={(e) => onFiltersChange({
            ...filters,
            solarPermits: {
              ...filters.solarPermits,
              status: e.target.value
            }
          })}
        >
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="filter-group">
        <h4>Features</h4>
        <div className="permit-features">
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.solarPermits.hasBattery || false}
              onChange={(e) => onFiltersChange({
                ...filters,
                solarPermits: {
                  ...filters.solarPermits,
                  hasBattery: e.target.checked
                }
              })}
            />
            Has Battery Storage
          </label>
        </div>
      </div>

      <div className="filter-group">
        <h4>Installer</h4>
        <div className="permit-features">
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.solarPermits.installers?.allBankrupt || false}
              onChange={(e) => handleInstallerChange('allBankrupt', e.target.checked)}
            />
            All bankrupt installers
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.solarPermits.installers?.expiredBankrupt || false}
              onChange={(e) => handleInstallerChange('expiredBankrupt', e.target.checked)}
            />
            Expired permits from bankrupt installers
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.solarPermits.installers?.lumio || false}
              onChange={(e) => handleInstallerChange('lumio', e.target.checked)}
            />
            Lumio
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.solarPermits.installers?.titanSolar || false}
              onChange={(e) => handleInstallerChange('titanSolar', e.target.checked)}
            />
            Titan Solar Power
          </label>
          <label className="feature-checkbox">
            <input
              type="checkbox"
              checked={filters.solarPermits.installers?.sunpower || false}
              onChange={(e) => handleInstallerChange('sunpower', e.target.checked)}
            />
            Sunpower
          </label>
        </div>
      </div>
    </>
  );
};

export default SolarPermitsPanel; 
import React from 'react';
import './FiltersPanel.css';

const FiltersPanel = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (category, subcategory, value) => {
    onFiltersChange({
      ...filters,
      [category]: {
        ...filters[category],
        [subcategory]: value
      }
    });
  };

  const handleNestedFilterChange = (category, subcategory, nestedKey, value) => {
    onFiltersChange({
      ...filters,
      [category]: {
        ...filters[category],
        [subcategory]: {
          ...filters[category][subcategory],
          [nestedKey]: value
        }
      }
    });
  };

  return (
    <div className="filters-panel">
      {/* Solar Permits Filters */}
      <div className="filter-section">
        <h3>Solar Permits</h3>
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-inputs">
            <input
              type="date"
              value={filters.solarPermits.dateRange[0] || ''}
              onChange={(e) => handleFilterChange('solarPermits', 'dateRange', [e.target.value, filters.solarPermits.dateRange[1]])}
            />
            <span>to</span>
            <input
              type="date"
              value={filters.solarPermits.dateRange[1] || ''}
              onChange={(e) => handleFilterChange('solarPermits', 'dateRange', [filters.solarPermits.dateRange[0], e.target.value])}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>System Capacity (kW)</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="50"
              value={filters.solarPermits.capacityRange[0]}
              onChange={(e) => handleFilterChange('solarPermits', 'capacityRange', [parseInt(e.target.value), filters.solarPermits.capacityRange[1]])}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="50"
              value={filters.solarPermits.capacityRange[1]}
              onChange={(e) => handleFilterChange('solarPermits', 'capacityRange', [filters.solarPermits.capacityRange[0], parseInt(e.target.value)])}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.solarPermits.status}
            onChange={(e) => handleFilterChange('solarPermits', 'status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.solarPermits.hasBattery}
              onChange={(e) => handleFilterChange('solarPermits', 'hasBattery', e.target.checked)}
            />
            Has Battery Storage
          </label>
        </div>
      </div>

      {/* EV Stations Filters */}
      <div className="filter-section">
        <h3>EV Stations</h3>
        <div className="filter-group">
          <label>Minimum Chargers</label>
          <input
            type="number"
            min="1"
            value={filters.evStations.minChargers}
            onChange={(e) => handleFilterChange('evStations', 'minChargers', parseInt(e.target.value))}
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.evStations.status}
            onChange={(e) => handleFilterChange('evStations', 'status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under-construction">Under Construction</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Network</label>
          <select
            value={filters.evStations.network}
            onChange={(e) => handleFilterChange('evStations', 'network', e.target.value)}
          >
            <option value="all">All Networks</option>
            <option value="ChargePoint">ChargePoint</option>
            <option value="Tesla">Tesla</option>
            <option value="EVgo">EVgo</option>
            <option value="Electrify America">Electrify America</option>
          </select>
        </div>
      </div>

      {/* Demographics Filters */}
      <div className="filter-section">
        <h3>Demographics</h3>
        <div className="filter-group">
          <label>Median Income</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="200000"
              step="1000"
              value={filters.demographics.income.min}
              onChange={(e) => handleNestedFilterChange('demographics', 'income', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="200000"
              step="1000"
              value={filters.demographics.income.max}
              onChange={(e) => handleNestedFilterChange('demographics', 'income', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Median Age</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="100"
              value={filters.demographics.age.min}
              onChange={(e) => handleNestedFilterChange('demographics', 'age', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.demographics.age.max}
              onChange={(e) => handleNestedFilterChange('demographics', 'age', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Home Ownership</label>
          <select
            value={filters.demographics.homeownership}
            onChange={(e) => handleFilterChange('demographics', 'homeownership', e.target.value)}
          >
            <option value="all">All</option>
            <option value="owned">Owned</option>
            <option value="rented">Rented</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Education Level</label>
          <select
            value={filters.demographics.education}
            onChange={(e) => handleFilterChange('demographics', 'education', e.target.value)}
          >
            <option value="all">All</option>
            <option value="highschool">High School</option>
            <option value="college">College</option>
            <option value="graduate">Graduate</option>
          </select>
        </div>
      </div>

      {/* Utility Boundaries Filters */}
      <div className="filter-section">
        <h3>Utilities</h3>
        <div className="filter-group">
          <label>Provider</label>
          <select
            value={filters.utilities.provider}
            onChange={(e) => handleFilterChange('utilities', 'provider', e.target.value)}
          >
            <option value="all">All Providers</option>
            <option value="pge">PG&E</option>
            <option value="sce">SCE</option>
            <option value="sdge">SDG&E</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Rate Type</label>
          <select
            value={filters.utilities.rateType}
            onChange={(e) => handleFilterChange('utilities', 'rateType', e.target.value)}
          >
            <option value="all">All Rate Types</option>
            <option value="tiered">Tiered</option>
            <option value="tou">Time of Use</option>
            <option value="flat">Flat Rate</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Solar Program</label>
          <select
            value={filters.utilities.hasSolarProgram === null ? 'all' : filters.utilities.hasSolarProgram.toString()}
            onChange={(e) => handleFilterChange('utilities', 'hasSolarProgram', e.target.value === 'all' ? null : e.target.value === 'true')}
          >
            <option value="all">All</option>
            <option value="true">Has Solar Program</option>
            <option value="false">No Solar Program</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel; 
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
      {/* Property Filters */}
      <div className="filter-section">
        <h3>Property</h3>
        <div className="filter-group">
          <label>Property Type</label>
          <select
            value={filters.property?.type || 'all'}
            onChange={(e) => handleFilterChange('property', 'type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="single">Single Family</option>
            <option value="multi">Multi Family</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Property Value</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="10000000"
              step="50000"
              value={filters.property?.value?.min || 0}
              onChange={(e) => handleNestedFilterChange('property', 'value', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="10000000"
              step="50000"
              value={filters.property?.value?.max || 1000000}
              onChange={(e) => handleNestedFilterChange('property', 'value', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Year Built</label>
          <div className="range-inputs">
            <input
              type="number"
              min="1900"
              max="2024"
              value={filters.property?.yearBuilt?.min || 1900}
              onChange={(e) => handleNestedFilterChange('property', 'yearBuilt', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="1900"
              max="2024"
              value={filters.property?.yearBuilt?.max || 2024}
              onChange={(e) => handleNestedFilterChange('property', 'yearBuilt', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Solar Permits Filters */}
      <div className="filter-section">
        <h3>Solar Permits</h3>
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-inputs">
            <input
              type="date"
              value={filters.solarPermits?.dateRange?.[0] || ''}
              onChange={(e) => handleFilterChange('solarPermits', 'dateRange', [e.target.value, filters.solarPermits?.dateRange?.[1]])}
            />
            <span>to</span>
            <input
              type="date"
              value={filters.solarPermits?.dateRange?.[1] || ''}
              onChange={(e) => handleFilterChange('solarPermits', 'dateRange', [filters.solarPermits?.dateRange?.[0], e.target.value])}
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
              value={filters.solarPermits?.capacityRange?.[0] || 0}
              onChange={(e) => handleFilterChange('solarPermits', 'capacityRange', [parseInt(e.target.value), filters.solarPermits?.capacityRange?.[1]])}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="50"
              value={filters.solarPermits?.capacityRange?.[1] || 50}
              onChange={(e) => handleFilterChange('solarPermits', 'capacityRange', [filters.solarPermits?.capacityRange?.[0], parseInt(e.target.value)])}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.solarPermits?.status || 'all'}
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
              checked={filters.solarPermits?.hasBattery || false}
              onChange={(e) => handleFilterChange('solarPermits', 'hasBattery', e.target.checked)}
            />
            Has Battery Storage
          </label>
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
              value={filters.demographics?.income?.min || 0}
              onChange={(e) => handleNestedFilterChange('demographics', 'income', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="200000"
              step="1000"
              value={filters.demographics?.income?.max || 200000}
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
              value={filters.demographics?.age?.min || 0}
              onChange={(e) => handleNestedFilterChange('demographics', 'age', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.demographics?.age?.max || 100}
              onChange={(e) => handleNestedFilterChange('demographics', 'age', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Home Ownership</label>
          <select
            value={filters.demographics?.homeownership || 'all'}
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
            value={filters.demographics?.education || 'all'}
            onChange={(e) => handleFilterChange('demographics', 'education', e.target.value)}
          >
            <option value="all">All</option>
            <option value="highschool">High School</option>
            <option value="college">College</option>
            <option value="graduate">Graduate</option>
          </select>
        </div>
      </div>

      {/* Utility Filters */}
      <div className="filter-section">
        <h3>Utilities</h3>
        <div className="filter-group">
          <label>Provider</label>
          <select
            value={filters.utilities?.provider || 'all'}
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
            value={filters.utilities?.rateType || 'all'}
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
            value={filters.utilities?.hasSolarProgram === null ? 'all' : filters.utilities?.hasSolarProgram?.toString()}
            onChange={(e) => handleFilterChange('utilities', 'hasSolarProgram', e.target.value === 'all' ? null : e.target.value === 'true')}
          >
            <option value="all">All</option>
            <option value="true">Has Solar Program</option>
            <option value="false">No Solar Program</option>
          </select>
        </div>
      </div>

      {/* Energy Score Filters */}
      <div className="filter-section">
        <h3>Energy Scores</h3>
        <div className="filter-group">
          <label>Solar Potential</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="100"
              value={filters.energyScores?.solarPotential?.min || 0}
              onChange={(e) => handleNestedFilterChange('energyScores', 'solarPotential', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.energyScores?.solarPotential?.max || 100}
              onChange={(e) => handleNestedFilterChange('energyScores', 'solarPotential', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Energy Usage</label>
          <div className="range-inputs">
            <input
              type="number"
              min="0"
              max="10000"
              step="100"
              value={filters.energyScores?.usage?.min || 0}
              onChange={(e) => handleNestedFilterChange('energyScores', 'usage', 'min', parseInt(e.target.value))}
            />
            <span>to</span>
            <input
              type="number"
              min="0"
              max="10000"
              step="100"
              value={filters.energyScores?.usage?.max || 10000}
              onChange={(e) => handleNestedFilterChange('energyScores', 'usage', 'max', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersPanel; 